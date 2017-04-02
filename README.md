# react-native-infinite-pager
RN Infinite Paging component

## Install

```
npm i --save https://github.com/gyetvan-andras/react-native-infinite-pager.git
```

## Usage

```javascript
<InfinitePager 
	renderItem={this.renderItem}
	initialKey={100}
	prevKey={this.prevKey}
	nextKey={this.nextKey}
	itemWidth={300}
	itemHeight={250}
	vertical={true}
	style={{marginBottom:10}}
/>
```
- ```renderItem``` callback to render the component for the given key. 
**example**:
```javascript
renderItem = (key) => {
	return (
		<View>
			<Text>{key}</Text>
		</View>
	)
}
```
- ```initialKey``` the first to display
- ```prevKey``` return key prior to the key passed as parameter.
**example**:
```javascript
prevKey = (key) => {
	if(key <= 98) return null
	return key - 1
}
```
- ```nextKey``` return key next to the key passed as parameter.
**example**:
```javascript
nextKey = (key) => {
	if(key <= 98) return null
	return key - 1
}
```
- ```itemWidth``` the width of an item
- ```itemHeight``` the height of an item
- ```vertical``` optional parameter. If true the paging direction will be vertical. By default the direction is horizontal