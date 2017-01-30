'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dispatch = exports.withStream = exports.toReact = exports.Action$ = exports.ACTION_CASCADE = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Streams = {};
var ACTION_CASCADE = exports.ACTION_CASCADE = 'ACTION_CASCADE';

/**
 * Step 1. Action$
 *
 * Stream with incoming user actions.
 */
var Dispatcher;
var Action$ = exports.Action$ = _xstream2.default.create({
  start: function start(listener) {
    Dispatcher = listener;
  },
  stop: function stop() {
    Dispatcher = null;
  }
});
Action$.ofType = function (type) {
  return Action$.filter(function (event) {
    return typeof type === 'string' ? event.type === type : type.indexOf(event.type) >= 0;
  }).debug('Action$[' + type + ']');
};

/**
 * Step 2. Export stream to React (a 'controller')
 *
 * Usage: stream.compose(toReact('name'))
 */
var toReact = exports.toReact = function toReact(name) {
  return function (stream) {
    stream = stream.remember();
    if (Streams[name]) {
      var err = 'toReact: ' + name + ' already exists!';
      console.error(err);
      this.error(err);
    } else {
      Streams[name] = stream;
    }
    return stream;
  };
};

/**
 * Step 3. Connect Raect Components to Rxjs
 * using a Higher Order Component
 *
 * Usage: withStream(['ctrlName'])(Component)
 */
var withStream = exports.withStream = function withStream(controllers) {
  return function (WrappedComponent) {
    var displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    displayName = 'RxContainer(' + displayName + ')';

    return _react2.default.createClass({
      displayName: displayName,
      componentWillMount: function componentWillMount() {
        var _this = this;

        this._subscriptions = controllers.map(function (name) {
          if (!Streams[name]) {
            throw new Error(displayName + ' cannot find controller ' + (name + ' because observable.toReact(\'' + name + '\') was never called.\n\n                Available controllers are: ' + Object.keys(Streams).join(', ')));
          }
          //console.log(`${displayName} subscribes to ${name}`);
          return Streams[name].subscribe({
            next: _this.handleControllerUpdate,
            error: _this.handleControllerError
          });
        });
      },
      componentWillUnmount: function componentWillUnmount() {
        //console.log('unsubscribe ',displayName);
        this._subscriptions.forEach(function (sub) {
          return sub.unsubscribe();
        });
      },
      handleControllerUpdate: function handleControllerUpdate(value) {
        this.setState(value);
      },
      handleControllerError: function handleControllerError(error) {
        this.setState({ error: error });
      },
      render: function render() {
        return _react2.default.createElement(WrappedComponent, _extends({}, this.props, this.state));
      }
    });
  };
};

/**
 * Step 4. Dispatch an event
 */
var dispatch = exports.dispatch = function dispatch(action, data) {
  if ((typeof action === 'undefined' ? 'undefined' : _typeof(action)) === 'object') {
    data = action;
  } else if (typeof action === 'string') {
    data = data || {};
    data.type = action;
  }
  // Unidirectional data-flow: an action can NEVER trigger another action
  // You can trace everything from the Action stream down.
  if (Action$.busy) {
    /* eslint no-console: "off" */
    console.error('Action$: ACTION_CASCADE', [Action$.busy, data.action]);
    Action$.error({ type: ACTION_CASCADE, actions: [Action$.busy, data.action] });
    return;
  }
  Dispatcher.busy = data.action;
  Dispatcher.next(data);
  Dispatcher.busy = false;
};
