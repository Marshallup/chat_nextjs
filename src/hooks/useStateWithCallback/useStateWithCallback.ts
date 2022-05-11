import { useCallback, useEffect, useRef, useState } from "react";
import { newStateType, CbType } from './types';

export default function useStateWithCallback<S>(initialState: S): [S, (newState: newStateType<S>, cb?: CbType<S>) => void] {
    const [ state, setState ] = useState(initialState);
    const cbRef = useRef<CbType<S> | undefined>(undefined);
    const updateState = useCallback((newState: newStateType<S> | S, cb?: CbType<S>) => {
        cbRef.current = cb;

        setState((prev) => newState instanceof Function ? newState(prev) : newState);
    }, []);

    useEffect(() => {
        if (cbRef.current) {
            cbRef.current(state);
            cbRef.current = undefined;
        }
    }, [ state ]);

    return [ state, updateState ];
}