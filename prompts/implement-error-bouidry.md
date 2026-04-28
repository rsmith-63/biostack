## Solution: Implement an Error Boundary

In React 19, an unhandled error in a component will cause the entire application root to unmount, which leads to the "Disappearing Page" effect. Wrapping vulnerable components in an Error Boundary ensures that if a third-party script causes a crash, only that specific component fails, while the rest of the application remains intact.

### Implementation using `react-error-boundary`

First, install the package:
```bash
npm install react-error-boundary