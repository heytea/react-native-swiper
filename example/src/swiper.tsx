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
  easingFunction?:
    | 'default'
    | 'linear'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic';
  /** current 改变时会触发 change 事件 */
  onChange?: () => void;
  /** swiper-item 的位置发生改变时会触发 transition 事件 */
  onTransition?: () => void;
  /** 动画结束时会触发 animationfinish 事件 */
  onAnimationFinish?: () => void;
}

interface IState {
  currentIndex: number;
}

interface DragPosition {
  x: number;
  y: number;
}

interface Node {
  val: JSX.Element;
  pre?: Node;
  next?: Node;
}

export default class HeyteaSwiper extends React.Component<
  HeyteaSwiperProps,
  IState
> {
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

  private windowWidth = Dimensions.get('window').width;
  private loopInterval: any;
  private scrollView: ScrollView | null;
  private startDragPosition: DragPosition;
  private endDragPosition: DragPosition;
  private firstNode?: Node;
  private lastNode?: Node;

  constructor(props: HeyteaSwiperProps) {
    super(props);
    this.scrollView = null;
    this.startDragPosition = {x: 0, y: 0};
    this.endDragPosition = {x: 0, y: 0};
    this.state = {
      currentIndex: 0,
    };
  }

  componentWillUnmount() {
    this.loopInterval && clearInterval(this.loopInterval);
  }

  scrollToIndex = (targetIndex: number, animate = true) => {
    this.scrollView &&
      this.scrollView.scrollTo({
        x: targetIndex * this.windowWidth,
        y: 0,
        animated: animate,
      });
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
      Math.abs(xDiff) / this.windowWidth > 0.25
        ? this.scrollToIndex(currentIndex - 1)
        : this.scrollToIndex(currentIndex);
    } else if (xDiff > 0) {
      // right
      Math.abs(xDiff) / this.windowWidth > 0.25
        ? this.scrollToIndex(currentIndex + 1)
        : this.scrollToIndex(currentIndex);
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
    const {interval, children} = this.props;
    const {currentIndex} = this.state;
    const childrenCount = children ? Object.keys(children).length : 0;
    this.loopInterval && clearInterval(this.loopInterval);
    if (childrenCount <= 1) {
      return;
    }
    this.loopInterval = setInterval(() => {
      if (currentIndex === childrenCount - 1) {
        this.scrollToIndex(0);
      } else {
        this.scrollToIndex(currentIndex + 1);
      }
    }, interval);
  };

  stopLoop = () => {
    this.loopInterval && clearInterval(this.loopInterval);
  };

  getElementListNode = (elements: JSX.Element[]) => {};

  listNodeToArray = () => {};

  /**
   * 将链表中的第一个节点移除，添加到最后作为尾结点
   */
  advanceOneNode = (firstNode: Node) => {
    if (this.firstNode && this.lastNode) {
      const tmpFirstNode = {...firstNode};
      tmpFirstNode.next = undefined;
      this.lastNode.next = tmpFirstNode;
      this.firstNode = firstNode.next;
    }
  };

  /**
   * 将链表中的最后一个节点，添加到最前，作为头结点
   */
  downOneNode = (lastNode: Node) => {
    if (this.firstNode && this.lastNode) {
      const tmpLastNode = {...lastNode};
      tmpLastNode.next = this.firstNode;
      tmpLastNode.pre = undefined;
      this.lastNode = lastNode.pre;
    }
  };

  renderItems() {
    const {children, circular} = this.props;
    this.windowWidth = Dimensions.get('window').width;
    let elements: JSX.Element[] = [];
    let firstElement;
    let lastElement;
    if (children) {
      const childrenKeys = Object.keys(children);
      const count = childrenKeys.length;
      elements = childrenKeys.map((key, index) => {
        if (index === 0) {
          firstElement = (
            <View key="first" style={{width: this.windowWidth}}>
              {
                // @ts-ignore
                children[key]
              }
            </View>
          );
        }
        if (index === count - 1) {
          lastElement = (
            <View key="last" style={{width: this.windowWidth}}>
              {
                // @ts-ignore
                children[key]
              }
            </View>
          );
        }
        return (
          <View key={index} style={{width: this.windowWidth}}>
            {
              // @ts-ignore
              children[key]
            }
          </View>
        );
      });
    }
    if (circular) {
      return [lastElement, elements, firstElement];
    }
    return elements;
  }

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
        {this.renderItems()}
      </ScrollView>
    );
  }

  renderIndicateDots() {
    const {
      children,
      indicatorColor,
      indicatorActiveColor,
      indicatorDots,
    } = this.props;
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
              index === currentIndex
                ? styles.indicatorActive
                : styles.indicator,
              index === currentIndex
                ? {backgroundColor: indicatorActiveColor}
                : {backgroundColor: indicatorColor},
            ]}
          />
        );
      });
    }
    return <View style={styles.indicateDotsBox}>{elements}</View>;
  }

  render() {
    const {style, autoplay} = this.props;
    if (autoplay) {
      this.startLoop();
    } else {
      this.stopLoop();
    }
    return (
      <View style={[styles.container, style]}>
        {this.renderScrollContent()}
        {this.renderIndicateDots()}
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
