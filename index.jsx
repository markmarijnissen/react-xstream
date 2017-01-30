import React from 'react';
import xs from 'xstream';

const Streams = {};
export const ACTION_CASCADE = 'ACTION_CASCADE';

/**
 * Step 1. Action$
 *
 * Stream with incoming user actions.
 */
var Dispatcher;
export const Action$ = xs.create({
  start: function(listener){
    Dispatcher = listener;
  },
  stop: function(){
    Dispatcher = null;
  }
});
Action$.ofType = type => Action$
  .filter(event => {
    return typeof type === 'string'? event.type === type: type.indexOf(event.type) >= 0
  })
  .debug(`Action$[${type}]`);

/**
 * Step 2. Export stream to React (a 'controller')
 *
 * Usage: stream.compose(toReact('name'))
 */
export const toReact = function(name){
  return function(stream){
    stream = stream.remember()
    if(Streams[name]) {
      const err = `toReact: ${name} already exists!`;
      console.error(err);
      this.error(err);
    } else {
      Streams[name] = stream;
    }
  return stream;
  }
}

/**
 * Step 3. Connect Raect Components to Rxjs
 * using a Higher Order Component
 *
 * Usage: withStream(['ctrlName'])(Component)
 */
export const withStream = function(controllers){
  return function (WrappedComponent){
    let displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    displayName = `RxContainer(${displayName})`;

    return React.createClass({
      displayName: displayName,
      componentWillMount: function(){
          this._subscriptions = controllers.map(name => {
            if(!Streams[name]){
              throw new Error(
                `${displayName} cannot find controller ` +
                `${name} because observable.toReact('${name}') was never called.

                Available controllers are: ${Object.keys(Streams).join(', ')}`
              );
            }
            //console.log(`${displayName} subscribes to ${name}`);
            return Streams[name].subscribe({
                next: this.handleControllerUpdate,
                error: this.handleControllerError
              });
          })
      },
      componentWillUnmount: function(){
        //console.log('unsubscribe ',displayName);
        this._subscriptions.forEach(sub => sub.unsubscribe())
      },
      handleControllerUpdate: function(value){
        this.setState(value);
      },
      handleControllerError: function(error ){
        this.setState({ error })
      },
      render() {
        return <WrappedComponent {...this.props} {...this.state} />;
      }
    });
  }
}

/**
 * Step 4. Dispatch an event
 */
export const dispatch = function(action,data){
  if(typeof action === 'object'){
    data = action;
  } else if(typeof action === 'string'){
    data = data || {};
    data.type = action;
  }
  // Unidirectional data-flow: an action can NEVER trigger another action
  // You can trace everything from the Action stream down.
  if(Action$.busy){
    /* eslint no-console: "off" */
    console.error('Action$: ACTION_CASCADE',[ Action$.busy, data.action ]);
    Action$.error({ type: ACTION_CASCADE, actions: [ Action$.busy, data.action ]});
    return;
  }
  Dispatcher.busy = data.action;
  Dispatcher.next(data);
  Dispatcher.busy = false;
}
