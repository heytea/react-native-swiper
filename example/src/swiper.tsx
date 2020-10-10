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
  private scrollView: ScrollView | null;
  private startDragPosition: DragPosition;
  private endDragPosition: DragPosition;

  constructor(props: HeyteaSwiperProps) {
    super(props);
    this.scrollView = null;
    this.startDragPosition = {x: 0, y: 0};
    this.endDragPosition = {x: 0, y: 0};
    this.state = {
      currentIndex: 0,
    };
  }

  scrollToIndex = (targetIndex: number) => {
    this.scrollView &&
      this.scrollView.scrollTo({
        x: targetIndex * this.windowWidth,
        y: 0,
        animated: true,
      });
    this.setState({
      currentIndex: targetIndex,
    });
  };

  onScrollBeginDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.startDragPosition = event.nativeEvent.contentOffset;
  };

  onScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    this.endDragPosition = event.nativeEvent.contentOffset;
    const {currentIndex} = this.state;
    const xDiff = this.endDragPosition.x - this.startDragPosition.x;
    if (xDiff < 0) {
      // left
      Math.abs(xDiff) / this.windowWidth > 0.3
        ? this.scrollToIndex(currentIndex - 1)
        : this.scrollToIndex(currentIndex);
    } else if (xDiff > 0) {
      // right
      Math.abs(xDiff) / this.windowWidth > 0.3
        ? this.scrollToIndex(currentIndex + 1)
        : this.scrollToIndex(currentIndex);
    }
  };

  renderItems() {
    const {children} = this.props;
    this.windowWidth = Dimensions.get('window').width;
    let elements: JSX.Element[] = [];
    if (children) {
      const childrenKeys = Object.keys(children);
      elements = childrenKeys.map((key, index) => {
        return (
          <View key={index} style={{width: this.windowWidth}}>
            {children[key]}
          </View>
        );
      });
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
        onScrollEndDrag={this.onScrollEndDrag}>
        {this.renderItems()}
      </ScrollView>
    );
  }

  renderIndicateDots() {
    const {children, indicatorColor, indicatorActiveColor} = this.props;
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
    const {style} = this.props;
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
