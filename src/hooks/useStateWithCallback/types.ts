export type newStateType<S> = S | ((prevState: S) => S);
export type CbType<S> = (state?: S) => void;