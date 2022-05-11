import { useCallback, useEffect, useRef } from "react";
import chatSocket from "@/services/socket";
import useStateWithCallback from "../useStateWithCallback";
import { ACTIONS } from "@/utils/ACTIONS_ROOMS";
import freeice from 'freeice';
import { LOCAL_VIDEO } from './constants';
import {
    peerMediaElementsInterface,
    peerConnectionInterface,
    handleNewPeerInterface,
    setRemoteMediaInterface,
    handleRemovePeer,
} from './interfaces';

export default function useWebRTC(roomID: string) {
    const [clients, setClients] = useStateWithCallback<string[]>([]);
    const peerConnection = useRef<peerConnectionInterface>({});
    const localMediaStream = useRef<MediaStream | null>(null);
    const peerMediaElements = useRef<peerMediaElementsInterface>({ [LOCAL_VIDEO]: null, });
    const addNewClient = useCallback((newClient: string, cb: () => void) => {
        setClients(list => {

            if (!list.includes(newClient)) {
                return [ ...list, newClient ];
            }

            return list;
        }, cb);
        /* eslint-disable-next-line */
    }, [ clients, setClients ]);

    useEffect(() => {
        async function handleNewPeer({ peerID, createOffer }: handleNewPeerInterface) {
            if (peerID in peerConnection.current) {
                return console.warn(`Already connected to peer ${peerID}`);
            }

            peerConnection.current[peerID] = new RTCPeerConnection({
                iceServers: freeice()
            });

            peerConnection.current[peerID].onicecandidate = event => {
                if (event.candidate) {
                    chatSocket.emit(ACTIONS.RELAY_ICE, {
                        peerID,
                        iceCandidate: event.candidate,
                    })
                }
            }

            let tracksNumber = 0;
            peerConnection.current[peerID].ontrack = ({ streams: [remoteStream] }) => {
                tracksNumber++;

                if (tracksNumber === 2) {
                    tracksNumber = 0;

                    addNewClient(peerID, () => {
                        const mediaElements = peerMediaElements.current[peerID];

                        if (mediaElements) {
                            mediaElements.srcObject = remoteStream;
                        }
                    });
                }
            }

            localMediaStream.current?.getTracks().forEach(track => {
                if (localMediaStream.current) {
                    peerConnection.current[peerID].addTrack(track, localMediaStream.current);
                }
            })

            if (createOffer) {
                const offer = await peerConnection.current[peerID].createOffer();

                await peerConnection.current[peerID].setLocalDescription(offer);

                chatSocket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: offer,
                });
            }
            
        }

        chatSocket.on(ACTIONS.ADD_PEER, handleNewPeer);

        return () => {
            chatSocket.off(ACTIONS.ADD_PEER);
        }
        /* eslint-disable-next-line */
    }, []);


    useEffect(() => {
        async function setRemoteMedia({ peerID, sessionDescription: remoteDescription }: setRemoteMediaInterface) {
            await peerConnection.current[peerID]?.setRemoteDescription(
                new RTCSessionDescription(remoteDescription),
            );


            if (remoteDescription.type === 'offer') {

                const answer = await peerConnection.current[peerID].createAnswer();

                await peerConnection.current[peerID].setLocalDescription(answer);

                chatSocket.emit(ACTIONS.RELAY_SDP, {
                    peerID,
                    sessionDescription: answer
                });
            }
        }

        chatSocket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

        return () => {
            chatSocket.off(ACTIONS.SESSION_DESCRIPTION);
        }
    }, []);


    useEffect(() => {
        function handleRemovePeer({ peerID }: handleRemovePeer) {

            if (peerConnection.current[peerID]) {
                peerConnection.current[peerID].close();
            }

            delete peerConnection.current[peerID];
            delete peerMediaElements.current[peerID];

            setClients(list => list.filter(c => c !== peerID));
        }

        chatSocket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

        return () => {
            chatSocket.off(ACTIONS.REMOVE_PEER);
        }
        /* eslint-disable-next-line */
    }, []);


    useEffect(() => {
        chatSocket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
            peerConnection.current[peerID]?.addIceCandidate(
                new RTCIceCandidate(iceCandidate)
            )
        });

        return () => {
            chatSocket.off(ACTIONS.ICE_CANDIDATE);
          }
    }, []);

    useEffect(() => {
        async function startCapcture() {
            localMediaStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: 720,
                    height: 720,
                }
            });

            addNewClient(LOCAL_VIDEO, () => {
                const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

                if (localVideoElement) {
                    localVideoElement.volume = 0;
                    localVideoElement.srcObject = localMediaStream.current;
                }
            });
        }

        startCapcture()
            .then(() => chatSocket.emit( ACTIONS.JOIN, { room: roomID, }))
            .catch(error => {
                console.error(`Проверьте доступность видео/аудио устройств: ${error.message}`);
                alert(`Проверьте доступность видео/аудио устройств: ${error.message}`);
            });


        return () => {
            localMediaStream.current?.getTracks().forEach(track => track.stop());
            chatSocket.emit(ACTIONS.LEAVE);
        }
        /* eslint-disable-next-line */
    }, [ roomID ]);

    const provideMediaRef = useCallback((id: string, node: HTMLVideoElement | null) => {
        peerMediaElements.current[id] = node;
    }, []);

    return {
        clients,
        provideMediaRef
    };
}

export {
    LOCAL_VIDEO,
}