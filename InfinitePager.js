import React, { Component, PropTypes } from 'react'
import { View, StyleSheet, PanResponder, Animated } from 'react-native'

let styles = StyleSheet.create({
	item: {
	},
	container: {
		flex: 0,
		flexWrap: 'nowrap',
		overflow: 'hidden'
	}
})

const PREV = 0
const CENTER = 1
const NEXT = 2

class Item extends Component {
	pos = 0
	constructor(props) {
		super(props)
		let sc = props.startScroll ? props.startScroll : 0
		this.pos = sc
		let x = 0
		let y = 0
		if (props.vertical) {
			y = sc
		} else {
			x = sc
		}
		this.state = {
			anim: new Animated.ValueXY({ x: x, y: y })
		}
	}

	_moveTo(sp, noanim) {
		this.pos = sp
		let x = 0
		let y = 0
		if (this.props.vertical) {
			y = sp
		} else {
			x = sp
		}
		if (noanim) {
			this.state.anim.setValue({ x: x, y: y })
		} else {
			Animated.spring(
				this.state.anim,
				{
					toValue: { x: x, y: y },
					bounciness: 12,
					speed: 20
				}
			).start();
		}
	}

	render() {
		return (
			<Animated.View
				ref={(ref) => this.wrapper = ref}
				style={[
					styles.item, this.props.style,
					{ transform: this.state.anim.getTranslateTransform() }
				]
				}>
				{this.props.children}
			</Animated.View>
		)
	}
}

class InfinitePager extends Component {
	itemStack = []
	items = []
	vertical = false
	scrollPos = 0
	scrollStart = 0
	itemLength = 0
	constructor(props) {
		super(props)
		this.vertical = props.vertical || false
		if (this.vertical) {
			this.itemLength = this.props.itemHeight
		} else {
			this.itemLength = this.props.itemWidth
		}
		this.scrollPos = -this.itemLength
		this.scrollStart = -this.itemLength

		this.panResponder = PanResponder.create({
			// onStartShouldSetPanResponder: (evt, gestureState) => true,
			// onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
			onMoveShouldSetPanResponder: (evt, gestureState) => true,
			onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
			onPanResponderMove: (evt, gestureState) => {
				this._scrollItems(gestureState.dx, gestureState.dy)
			},
			onPanResponderGrant: (evt, gestureState) => {
				this.startPos = this.items[CENTER].pos
			},
			onPanResponderRelease: (evt, gestureState) => {
				this._saveScrollPos(gestureState.dx, gestureState.dy);
			}
		})
	}

	componentDidMount() {
		this._createItems()
		this.forceUpdate()
	}

	_createItems = () => {
		this.keys = [null, null, null]
		this.items = [null, null, null]
		this.itemStack = [null, null, null]
		this.keys[CENTER] = this.props.initialKey //center
		this.keys[PREV] = this.props.prevKey(this.keys[CENTER]) //left
		this.keys[NEXT] = this.props.nextKey(this.keys[CENTER]) //right
		this._createItem(PREV, false)
		this._createItem(CENTER, true, -this.itemLength)
		this._createItem(NEXT, false)
	}

	_createItem = (idx, withContent, startScroll) => {
		let key = this.keys[idx]
		let ret
		if (withContent) {
			let content = this.props.renderItem(key)
			ret = (
				<Item
					vertical={this.vertical}
					itemKey={key}
					startScroll={startScroll}
					ref={(ref) => { if (ref) this.items[idx] = ref }}
					key={key}
					style={[styles.item, { width: this.props.itemWidth, height: this.props.itemHeight }]}>
					{content}
				</Item>
			)
		} else {
			ret = (
				<Item
					key={key}
					style={[styles.item, { width: this.props.itemWidth, height: this.props.itemHeight }]}>
				</Item>
			)
		}
		this.itemStack[idx] = ret
	}

	_ensure = (idx) => {
		let itm = this.itemStack[idx]
		if (itm && itm.props.itemKey) return
		this._createItem(idx, true, this.scrollStart)
		this.forceUpdate()
	}

	_snapTo = (pos) => {
		this.scrollStart = pos
		this._scrollItemsTo(pos)
	}

	_saveScrollPos = (dx,dy) => {
		let moveDelta = this.vertical ? dy : dx
		this.scrollStart = this.scrollPos
		let w = this.itemLength
		let pageStart = w + ((this.scrollStart / w - Math.ceil(this.scrollStart / w)) * w)
		let centerPos = this.items[CENTER].pos
		if (centerPos === w * -2 || centerPos === 0) return

		// console.log('Move delta',moveDelta)
		// console.log('Center pos',centerPos)
		// console.log('Page start',pageStart)
		// console.log('-----------------')
		let w2 = w / 2
		let w4 = w / 4

		if(moveDelta < 0) {// <--
			if(moveDelta === centerPos) { //at the BEGIN
				if(moveDelta < -w4) {
					this._snapTo(-w)
				} else {
					this._snapTo(0)
				}
			} else {
				if(moveDelta < -w4) {
					this._snapTo(-w*2)
				} else {
					this._snapTo(-w)
				}
			}
		} else { // -->
			if(centerPos < -w) { //at the END
				if(moveDelta > w4) {
					this._snapTo(-w)
				} else {
					this._snapTo(-w*2)
				}
			} else {
				if(moveDelta > w4) {
					this._snapTo(0)
				} else {
					this._snapTo(-w)
				}
			}
		}
	}

	_pushItemsLeft = () => { // <---
		// [-][<-][<-][+]
		// console.log('push items left')
		// this._printItems()

		this.keys.splice(0, 1)
		this.keys.push(this.props.nextKey(this.keys[CENTER]))

		this.items.splice(0, 1)
		this.items.push(null)

		this.itemStack.splice(0, 1)
		this.itemStack.push(null)
		this.scrollStart += this.itemLength
		this.scrollPos += this.itemLength

		this._ensure(NEXT)
	}

	_pushItemsRight = () => { // --->
		// [+][->][->][-]
		//left += itemWidth
		// console.log('push items right')
		this.keys.pop()
		this.keys.splice(0, 0, this.props.prevKey(this.keys[PREV]))

		this.items.pop()
		this.items.splice(0, 0, null)

		this.itemStack.pop()
		this.itemStack.splice(0, 0, null)

		this.scrollStart -= this.itemLength
		this.scrollPos -= this.itemLength
		// console.log('keys',this.keys)
		this._ensure(PREV)
	}

	_scrollItemsTo = (dx, noanim = false) => {
		this.items.forEach((item) => {
			if (item) item._moveTo(dx, noanim)
		})
	}

	_scrollItems = (dx, dy) => {
		let np = this.vertical ? dy : dx
		let newPos = this.scrollStart + np
		// console.log('np',newPos)
		if (newPos < -this.itemLength) { //scrolling <--
			if (newPos <= this.itemLength * -2) {
				let nk = this.props.nextKey(this.keys[NEXT])
				if (!nk) {
					this.scrollPos = this.itemLength * -2
					this._scrollItemsTo(this.scrollPos)
					return
				} else {
					this._pushItemsLeft()
					newPos = this.scrollStart + np
					this._scrollItemsTo(newPos, true)
					return
				}
			} else {
				this._ensure(NEXT)
			}
		} else { //scrolling -->
			if (newPos >= 0) {
				let nk = this.props.prevKey(this.keys[PREV])
				if (!nk) {
					this.scrollPos = 0
					this._scrollItemsTo(this.scrollPos)
					return
				} else {
					this._pushItemsRight()
					newPos = this.scrollStart + np
					this._scrollItemsTo(newPos, true)
					return
				}
			} else {
				this._ensure(PREV)
			}
		}
		this.scrollPos = this.scrollStart + np
		this._scrollItemsTo(this.scrollPos)
		// console.log('SP:',this.scrollPos)

	}

	render() {
		let layout = this.props.vertical ? { flexDirection: 'column' } : { flexDirection: 'row' }
		return (
			<View {...this.panResponder.panHandlers}
				style={[styles.container, layout, { width: this.props.itemWidth, height: this.props.itemHeight }, this.props.style]}>
				{this.itemStack}
			</View>
		)
	}
}

InfinitePager.propTypes = {
	renderItem: PropTypes.func.isRequired,//key passed
	initialKey: PropTypes.any.isRequired,//get the 0 key
	prevKey: PropTypes.func.isRequired,//get the preceding key relative to passed key
	nextKey: PropTypes.func.isRequired,//get the next key of current key
	itemWidth: PropTypes.number.isRequired,
	itemHeight: PropTypes.number.isRequired
}

export default InfinitePager
