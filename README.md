# React Xstream

Unidirectional data-flow in React using XStream

1. In the UI, dispatch actions using `dispatch(LABEL, {})`
2. Listen to the `Action$` (action-stream) and handle business logic using xstream
3. Publish a stream to react: `stream.compose(toReact('user'))`
4. Connect React to a Stream: `EnhancedComponent = withStream(['user'])(MyComponent)`

#### Listen to Action$ and handle logic using Xstream
```jsx
import { Action$, toReact } from 'react-xstream';

// Step 1. Listen to the Action$
Action$
  .ofType('LOGIN')
  .map(function(){
    /* do stuff */
    return { name: 'Mark', role: 'Admin'}
  })
  // Step 2. Publish data to React
  .map(user => ({ user }))
  .compose(toReact('user'))
```

### Listen to a Stream in React
```jsx
import { withStream, dispatch } from 'react-xstream';

// In your component
class MyComponent() extends Component {
  componentWillReceiveProps(props){
    this.setState(props)
  }

  // Step 3. Render your data in react
  render() {
    <div>Current user: { this.props.user.name }</div>;
  }  

  // Step 4. Dispatch actions, goto step 1
  onLoginClick(){
    dispatch('LOGIN', {username: '...', password: '...' })
  }
}

export default withStream(['user'])(MyComponent)
```
