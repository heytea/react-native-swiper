import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  GestureResponderEvent,
} from 'react-native';

export interface HeyteaSwiperProps {
  style?: StyleProp<ViewStyle>;
  /** 是否显示面板指示点 */
  indicatorDots?: boolean;
  /** 指示点颜色 */
  indicatorColor?: string;
  /** 当前选中的指示点颜色 */
  indicatorActiveColor?: string;
  /** 是否自动切换 */
  autoplay?: boolean;
  /** 当前所在滑块的 index */
  current?: number;
  /** 自动切换时间间隔 */
  interval?: number;
  /** 滑动动画时长 */
  duration?: number;
  /** 是否采用衔接滑动 */
  circular?: boolean;
  /** 滑动方向是否为纵向 */
  vertical?: boolean;
  /** 前边距，可用于露出前一项的一小部分 */
  previousMargin?: number;
  /** 后边距，可用于露出后一项的一小部分 */
  nextMargin?: number;
  /** 同时显示的滑块数量 */
  displayMultipleItems?: number;
  /** 指定 swiper 切换缓动动画类型 */
  easingFunction?: 'default' | 'linear' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic';
  /** current 改变时会触发 change 事件 */
  onChange?: () => void;
  /** swiper-item 的位置发生改变时会触发 transition 事件 */
  onTransition?: () => void;
  /** 动画结束时会触发 animationfinish 事件 */
  onAnimationFinish?: () => void;
}

interface IState {
  currentIndex: number;
  forceUpdate: number;
  pan: Animated.ValueXY;
}

interface DragPosition {
  x: number;
  y: number;
}

export default class HeyteaSwiper extends React.Component<HeyteaSwiperProps, IState> {
  static defaultProps = {
    style: {},
    indicatorDots: true,
    indicatorColor: 'rgba(0, 0, 0, 0.2)',
    indicatorActiveColor: 'rgba(0, 0, 0, 0.6)',
    autoplay: true,
    current: 0,
    interval: 5000,
    duration: 500,
    circular: true,
    vertical: false,
    previousMargin: 0,
    nextMargin: 0,
    displayMultipleItems: 1,
    easingFunction: 'default',
  };

  private loopInterval: any;
  private scrollView: ScrollView | null;
  private startDragPosition: DragPosition;
  private endDragPosition: DragPosition;
  private swiperItems: JSX.Element[];
  private itemWidth = Dimensions.get('window').width;
  /**
   * 是否朝左滑动
   */
  private isForwardLeft: boolean;

  constructor(props: HeyteaSwiperProps) {
    super(props);
    this.scrollView = null;
    this.startDragPosition = {x: 0, y: 0};
    this.endDragPosition = {x: 0, y: 0};
    this.swiperItems = [];
    this.isForwardLeft = true;
    this.state = {
      currentIndex: 0,
      forceUpdate: 0,
      pan: new Animated.ValueXY({x: -this.itemWidth, y: 0}),
    };
  }

  componentDidMount() {
    this.initData();
  }

  componentDidUpdate(prevProps: HeyteaSwiperProps) {
    if (prevProps !== this.props) {
      this.initData();
    }
  }

  componentWillUnmount() {
    this.loopInterval && clearInterval(this.loopInterval);
  }

  /**
   * 强制刷新
   */
  forceUpdate = () => {
    this.setState((prevState) => ({
      forceUpdate: prevState.forceUpdate > 99 ? 0 : prevState.forceUpdate + 1,
    }));
  };

  /**
   * 初始化Swiper数据
   */
  private initData = () => {
    const {children, circular, autoplay} = this.props;
    let elements: JSX.Element[] = [];
    if (children) {
      if (Array.isArray(children)) {
        const childrenKeys = Object.keys(children);
        elements = childrenKeys.map((key, index) => {
          return (
            <View key={index} style={{width: this.itemWidth}}>
              {
                // @ts-ignore
                children[key]
              }
            </View>
          );
        });
      } else {
        elements = [
          <View key={1} style={{width: this.itemWidth}}>
            {children}
          </View>,
        ];
      }
    }
    this.swiperItems = circular ? this.getCircularListNode(elements) : elements;
    this.forceUpdate();
    if (autoplay) {
      this.startLoop();
    } else {
      this.stopLoop();
    }
  };

  /**
   * 滑动到指定索引位置
   * @param targetIndex 目标索引
   * @param animate 是否开启动画
   */
  scrollToIndex = (targetIndex: number, animate = true) => {
    const {circular} = this.props;
    this.scrollView &&
      this.scrollView.scrollTo({
        x: targetIndex * this.itemWidth + (circular ? this.itemWidth : 0),
        y: 0,
        animated: animate,
      });
    this.isForwardLeft = targetIndex > this.state.currentIndex;
    this.setState({
      currentIndex: targetIndex,
    });
  };

  onScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.startDragPosition = event.nativeEvent.contentOffset;
    this.stopLoop();
  };

  onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {currentIndex} = this.state;
    this.endDragPosition = event.nativeEvent.contentOffset;
    const xDiff = this.endDragPosition.x - this.startDragPosition.x;
    if (xDiff < 0) {
      // left
      Math.abs(xDiff) / this.itemWidth > 0.25 ? this.scrollToIndex(currentIndex - 1) : this.scrollToIndex(currentIndex);
    } else if (xDiff > 0) {
      // right
      Math.abs(xDiff) / this.itemWidth > 0.25 ? this.scrollToIndex(currentIndex + 1) : this.scrollToIndex(currentIndex);
    }
    const {autoplay} = this.props;
    if (autoplay) {
      this.startLoop();
    } else {
      this.stopLoop();
    }
  };

  onMomentumScrollEnd = () => {
    const {onAnimationFinish} = this.props;
    onAnimationFinish && onAnimationFinish();
  };

  startLoop = () => {
    const {interval} = this.props;
    const childrenCount = this.getChildrenCount();
    this.loopInterval && clearInterval(this.loopInterval);
    if (childrenCount <= 1) {
      return;
    }
    this.loopInterval = setInterval(() => {
      const {circular} = this.props;
      if (circular) {
        this.scrollToNext();
      } else {
        const {currentIndex} = this.state;
        if (currentIndex === this.getChildrenCount() - 1) {
          this.scrollToIndex(0);
        } else {
          this.scrollToIndex(currentIndex + 1);
        }
      }
    }, interval);
  };

  stopLoop = () => {
    this.loopInterval && clearInterval(this.loopInterval);
  };

  getChildrenCount = () => {
    const {children} = this.props;
    return children ? Object.keys(children).length : 0;
  };

  /**
   * 将顺序表中的第一个节点移除，添加到最后作为尾结点
   */
  advanceOneNode = (elements: JSX.Element[]) => {
    if (elements.length < 2) {
      return elements;
    }
    const firstNode = elements.shift();
    if (firstNode) {
      elements.push(firstNode);
    }
    return elements;
  };

  /**
   * 将顺序表的最后一个节点，添加到最前，作为头结点
   */
  downOneNode = (elements: JSX.Element[]) => {
    if (elements.length < 2) {
      return elements;
    }
    const lastNode = elements.pop();
    if (lastNode) {
      elements.unshift(lastNode);
    }
    return elements;
  };

  /**
   * 获取衔接模式的顺序表节点，需要现第一个元素是原最后一个，现最后一个元素是原第一个
   */
  getCircularListNode = (elements: JSX.Element[]) => {
    if (!elements || elements.length < 2) {
      return elements;
    }
    const firstNode = {...elements[elements.length - 1]};
    firstNode.key = 'first';
    const lastNode = {...elements[0]};
    lastNode.key = 'last';
    elements.unshift(firstNode);
    elements.push(lastNode);
    return elements;
  };

  onTouchStart = (event: GestureResponderEvent) => {
    this.startDragPosition = {x: event.nativeEvent.pageX, y: event.nativeEvent.pageY};
    this.stopLoop();
  };

  onTouchMove = (event: GestureResponderEvent) => {
    const xDiff = event.nativeEvent.pageX - this.startDragPosition.x;
    this.setState({
      pan: new Animated.ValueXY({
        x: xDiff - this.itemWidth,
        y: 0,
      }),
    });
  };

  onTouchEnd = (event: GestureResponderEvent) => {
    this.endDragPosition = {x: event.nativeEvent.pageX, y: event.nativeEvent.pageY};
    const xDiff = this.endDragPosition.x - this.startDragPosition.x;
    if (xDiff < 0) {
      // left
      Math.abs(xDiff) / this.itemWidth > 0.25 ? this.scrollToNext() : this.scrollToReset(true);
    } else if (xDiff > 0) {
      // right
      Math.abs(xDiff) / this.itemWidth > 0.25 ? this.scrollToPrev() : this.scrollToReset(true);
    }
    const {autoplay} = this.props;
    if (autoplay) {
      this.startLoop();
    } else {
      this.stopLoop();
    }
  };

  scrollToPrev = () => {
    Animated.timing(this.state.pan, {
      toValue: {x: 0, y: 0},
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      this.swiperItems.shift();
      this.swiperItems.pop();
      this.downOneNode(this.swiperItems);
      this.getCircularListNode(this.swiperItems);
      this.scrollToReset(false);
    });
  };

  scrollToNext = () => {
    Animated.timing(this.state.pan, {
      toValue: {x: -this.itemWidth * 2, y: 0},
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      this.swiperItems.shift();
      this.swiperItems.pop();
      this.advanceOneNode(this.swiperItems);
      this.getCircularListNode(this.swiperItems);
      this.scrollToReset(false);
    });
  };

  scrollToReset = (animate = true) => {
    if (animate) {
      Animated.timing(this.state.pan, {
        toValue: {x: -this.itemWidth, y: 0},
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      this.setState({
        pan: new Animated.ValueXY({x: -this.itemWidth, y: 0}),
      });
    }
  };

  renderScrollContent() {
    const {vertical} = this.props;
    return (
      <ScrollView
        ref={(c) => {
          this.scrollView = c;
        }}
        horizontal={!vertical}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={this.onScrollBeginDrag}
        onScrollEndDrag={this.onScrollEndDrag}
        onMomentumScrollEnd={this.onMomentumScrollEnd}>
        {this.swiperItems}
      </ScrollView>
    );
  }

  renderCircularContent() {
    const {} = this.props;
    const {pan} = this.state;
    console.log('pan', this.state.pan);
    return (
      <View style={{position: 'relative'}}>
        <Animated.View
          style={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'row',
            transform: [{translateX: pan.x}, {translateY: pan.y}],
          }}
          onTouchStart={this.onTouchStart}
          onTouchMove={this.onTouchMove}
          onTouchEnd={this.onTouchEnd}>
          {this.swiperItems}
        </Animated.View>
      </View>
    );
  }

  renderIndicateDots() {
    const {children, indicatorColor, indicatorActiveColor, indicatorDots} = this.props;
    if (!indicatorDots) {
      return null;
    }
    const {currentIndex} = this.state;
    let elements: JSX.Element[] = [];
    if (children) {
      const childrenKeys = Object.keys(children);
      elements = childrenKeys.map((item, index) => {
        return (
          <View
            style={[
              index === currentIndex ? styles.indicatorActive : styles.indicator,
              index === currentIndex ? {backgroundColor: indicatorActiveColor} : {backgroundColor: indicatorColor},
            ]}
          />
        );
      });
    }
    return <View style={styles.indicateDotsBox}>{elements}</View>;
  }

  render() {
    const {style, circular} = this.props;
    return (
      <View style={[styles.container, style]}>
        {circular ? this.renderCircularContent() : this.renderScrollContent()}
        {/* {this.renderScrollContent()} */}
        {/* {this.renderIndicateDots()} */}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  indicateDotsBox: {
    position: 'absolute',
    bottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 10,
    marginLeft: 2,
    marginRight: 2,
  },
  indicatorActive: {
    width: 8,
    height: 8,
    borderRadius: 10,
    marginLeft: 2,
    marginRight: 2,
  },
});
