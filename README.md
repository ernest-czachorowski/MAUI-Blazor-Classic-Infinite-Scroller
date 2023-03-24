# MAUI-Blazor-Infinite-Scroller

This is a classic implementation of the Infinity Scroller for Blazor WebAssembly and .NET MAUI Blazor App.

The scroller can be attached to the main DOM window element, div elements, or any other element. The scroller takes two parameters:

  ***OnBottomReached** of type EventCallback, which is a callback to a function that should be run when the scroller reaches the bottom.
  ***ElementId** of type string, which is the DOM element ID of the object to track. If ElementId is empty or null, the scroller will use the DOM window as the Infinite Scroller container.

Multiple scrollers can be instantiated in the same component, but a single component can execute only one function passed as a parameter. However, multiple scrollers with different callbacks can be assigned to the same DOM element. The scroller should work for web apps, desktop apps, and mobile apps.

### How to use:

1. Import the InfiniteScroller.js file at the bottom of the index.html file:
```
<script src="InfiniteScroller.js"></script>
```
2. Prepare any method to be called by the infinity scroller, for example:
```
private async Task LoadMoreItems()
{
    do something...
}
```
3. Add the InfiniteScroller component in any location in your component. Done!
```
<InfiniteScroller OnBottomReached="LoadMoreItems" />
```
3.1. If desired, you can create a div with an ID and pass that ID to the scroller to attach it to the div:
```
<div id="div_with_id_1" style="overflow-y: scroll; height: 300px;">
    some content...
</div>

<InfiniteScroller OnBottomReached="LoadMoreItems" ElementId="div_with_id_1" />
```
3.2. If desired, you can add multiple InfiniteScroller components in the same component, passing them different element IDs and methods:
```
<InfiniteScroller OnBottomReached="LoadMoreItems_0" />
<InfiniteScroller OnBottomReached="LoadMoreItems_1" />

<InfiniteScroller OnBottomReached="LoadMoreItems_0" ElementId="div_with_id_1" />
<InfiniteScroller OnBottomReached="LoadMoreItems_1" ElementId="div_with_id_1" />

<InfiniteScroller OnBottomReached="LoadMoreItems_2" ElementId="div_with_id_2" />
<InfiniteScroller OnBottomReached="LoadMoreItems_3" ElementId="div_with_id_2" />
```

## Blazor WebAssembly Demo
<img src="https://github.com/ernest-czachorowski/MAUI-Blazor-Classic-Infinite-Scroller/blob/main/demo_web.gif" width="600" />

## .NET MAUI Blazor App Demo
<img src="https://github.com/ernest-czachorowski/MAUI-Blazor-Classic-Infinite-Scroller/blob/main/demo_mobile.gif" width="300" />
