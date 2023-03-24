class InfiniteScroller {
    static #scrollEvent = new Event('scroll');
    static #mouseOrTouchPointingElement = false;

    #domRef = null;
    #dotnetRefs = [];
    #timeout = null;
    // Set a delay between scroll events to avoid spamming the main application.
    #scrollEventTimeout = null;
    // Specify the margin from the bottom of the DOM element at which the event is fired.
    #scrollTriggerMargin = null;
    
    get dotnetRefs() {
        return this.#dotnetRefs;
    }

    get domRef() {
        return this.#domRef;
    }

    constructor(domRef, dotnetRef, scrollEventTimeout = 200, scrollTriggerMargin = 75) {
        this.#domRef = domRef;
        this.addDotnetReference(dotnetRef);
        this.#scrollEventTimeout = scrollEventTimeout;
        this.#scrollTriggerMargin = scrollTriggerMargin;

        // If the tracked DOM element is not the DOM window, do not listen for scroll events until the user is not hovering over the DOM element.
        // Instead watch if user hovers over element. When the user hovers over an element, set up wheel event, touchmove event and scroll event.
        if (this.#domRef !== document.defaultView) {
            this.#domRef.addEventListener('touchstart', this.touchStart);
            this.#domRef.addEventListener('touchend', this.touchEnd);
            this.#domRef.addEventListener('mouseenter', this.mouseEnter);
            this.#domRef.addEventListener('mouseleave', this.mouseLeave);
        }
        // If the tracked DOM element is the DOM window, listen for wheel, touchmove, and scroll events.
        // We have the #mouseOrTouchPointingElement flag to check if the user is hovering over any inner elements,
        // and determine whether to fire the scroll event on the DOM window or another element.
        else {
            this.#domRef.addEventListener('touchmove', this.dispatchScrollEvent);
            this.#domRef.addEventListener('wheel', this.dispatchScrollEvent);
            this.#domRef.addEventListener('scroll', this.scrollWindowEventHandler);
        }
    }

    // Add events when the mouse pointer is hovering on an element other than the DOM window.
    mouseEnter = () => {
        this.#domRef.addEventListener('wheel', this.dispatchScrollEvent);
        this.#domRef.addEventListener('scroll', this.scrollEventHandler);
        InfiniteScroller.#mouseOrTouchPointingElement = true;
    }

    // Remove events when the mouse pointer leaves an element other than the DOM window.
    mouseLeave = () => {
        this.#domRef.removeEventListener('wheel', this.dispatchScrollEvent);
        this.#domRef.removeEventListener('scroll', this.scrollEventHandler);
        InfiniteScroller.#mouseOrTouchPointingElement = false;
    }

    // Add events when a finger touches an element other than the DOM window.
    touchStart = () => {
        this.#domRef.addEventListener('touchmove', this.dispatchScrollEvent);
        this.#domRef.addEventListener('scroll', this.scrollEventHandler);
        InfiniteScroller.#mouseOrTouchPointingElement = true;
    }

    // Remove events when the finger stops touching the screen.
    touchEnd = () => {
        this.#domRef.removeEventListener('touchmove', this.dispatchScrollEvent);
        this.#domRef.removeEventListener('scroll', this.scrollEventHandler);
        InfiniteScroller.#mouseOrTouchPointingElement = false;
    }

    // Add a .NET reference if it does not exist.
    addDotnetReference = (dotnetRef) => {
        const isAlreadyThere = this.#dotnetRefs.find(el => dotnetRef._id === el._id);

        if (isAlreadyThere)
            return;

        this.#dotnetRefs.push(dotnetRef);
    }

    // Remove the .NET reference.
    // Remove events from the DOM element only if there are no more .NET references left in this DOM element.
    removeDotnetReference = (dotnetRef) => {
        this.#dotnetRefs = this.#dotnetRefs.filter(el => el._id !== dotnetRef._id)

        if (this.#dotnetRefs.length == 0) {
            if (this.#domRef !== document.defaultView) {
                this.#domRef.removeEventListener('touchstart', this.touchStart);
                this.#domRef.removeEventListener('touchend', this.touchEnd);
                this.#domRef.removeEventListener('mouseenter', this.mouseEnter);
                this.#domRef.removeEventListener('mouseleave', this.mouseLeave);
            }
            else {
                this.#domRef.removeEventListener('touchmove', this.dispatchScrollEvent);
                this.#domRef.removeEventListener('wheel', this.dispatchScrollEvent);
                this.#domRef.removeEventListener('scroll', this.scrollWindowEventHandler);
            }
        }
    }

    // Run when the 'scroll' event fires for a DOM element other than the window.
    // Use a short delay to avoid spamming the main application.
    scrollEventHandler = () => {
        if (this.#timeout) {
            clearTimeout(this.#timeout);
        }

        this.#timeout = setTimeout(() => {
            if (this.#domRef.scrollHeight - this.#domRef.scrollTop <= this.#domRef.clientHeight + this.#scrollTriggerMargin) {
                for (const ref in this.#dotnetRefs) {
                    this.#dotnetRefs[ref].invokeMethodAsync('OnScrollReachedBottom');
                }
            }
        }, this.#scrollEventTimeout);
    }

    // Run when the 'scroll' event fires for the DOM window element.
    // Use a short delay to avoid spamming the main application.
    scrollWindowEventHandler = () => {
        // If the mouse or touch is pointing at an inner tracked element other than the DOM window, return.
        if (InfiniteScroller.#mouseOrTouchPointingElement == true) {
            return;
        }

        if (this.#timeout) {
            clearTimeout(this.#timeout);
        }

        this.#timeout = setTimeout(() => {
            if (document.documentElement.scrollHeight - document.documentElement.scrollTop <= document.documentElement.clientHeight + this.#scrollTriggerMargin) {
                for (const ref in this.#dotnetRefs) {
                    this.#dotnetRefs[ref].invokeMethodAsync('OnScrollReachedBottom');
                }
            }
        }, this.#scrollEventTimeout);
    }

    // Fire the 'scroll' event when there is no visible scroller on the tracked DOM element.
    dispatchScrollEvent = () => {
        // If the tracked element is the DOM window.
        if (this.#domRef === document.defaultView) {
            // Return if the mouse or touch is pointing at an tracked element other than the DOM window.
            if (InfiniteScroller.#mouseOrTouchPointingElement == true) {
                return;
            }
            if (document.documentElement.scrollHeight == document.documentElement.clientHeight) {
                this.#domRef.dispatchEvent(InfiniteScroller.#scrollEvent);
            }
        }
        // If the tracked element is different than the DOM window.
        else {
            InfiniteScroller.#mouseOrTouchPointingElement = true;
            if (this.#domRef.scrollHeight == this.#domRef.clientHeight) {
                this.#domRef.dispatchEvent(InfiniteScroller.#scrollEvent);
            }
        }
    }
}

class InfiniteScrollerHandler {
    // Array 'infiniteScrollers', holds instances of InfiniteScroller, which contains all references for .NET and tracked DOM elements.
    static infiniteScrollers = [];

    // Create a new InfiniteScroller instance or add a .NET reference to an existing InfiniteScroller instance.
    static setDotnetReference(dotnetRef, elementId) {
        let domElementRef = null;

        if (elementId) {
            domElementRef = document.getElementById(elementId);
        }
        else {
            domElementRef = document.defaultView;
        }

        const existingDomElementRef = this.infiniteScrollers.find(el => el.domRef === domElementRef);

        // If the DOM element is already being tracked, add another .NET reference to it.
        if (existingDomElementRef) {
            existingDomElementRef.addDotnetReference(dotnetRef);
        }
        // Otherwise, create a new InfiniteScroller instance and start tracking the DOM element.
        else {
            this.infiniteScrollers.push(new InfiniteScroller(domElementRef, dotnetRef));
        }
    }

    // Remove the .NET reference from the tracked DOM element.
    // If there are no more .NET references, stop tracking the DOM element.
    static unsetDotnetReference(dotnetRef, elementId) {
        let domElementRef = null;

        if (elementId) {
            domElementRef = document.getElementById(elementId);
        }
        else {
            domElementRef = document.defaultView;
        }

        const existingDomElementRef = this.infiniteScrollers.find(el => el.domRef === domElementRef);

        // Remove the .NET reference from the DOM element.
        if (existingDomElementRef) {
            existingDomElementRef.removeDotnetReference(dotnetRef);
            // If there are no more references to .NET in the selected DOM element, stop tracking it.
            if (existingDomElementRef.dotnetRefs.length == 0) {
                this.infiniteScrollers = this.infiniteScrollers.filter(el => el.domRef !== domElementRef)
            }
        }
    }
}

// This is the global reference to the InfiniteScroller. It must be present here to be visible from the .NET framework.
window.InfiniteScrollerHandler = InfiniteScrollerHandler;