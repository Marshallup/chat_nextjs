import type { NextPage, GetServerSidePropsContext } from 'next';
import useWebRTC, { LOCAL_VIDEO } from '@/hooks/useWebRTC';
import MainLayout from '@/layouts/MainLayout';

const Room: NextPage<{ roomID: string }> = ({ roomID }) => {
    
    const {
        clients,
        provideMediaRef,
    } = useWebRTC(roomID);
    
    return (
        <MainLayout>
            {
                clients.map(clientID => {
                    return (
                        <div key={clientID} id={clientID}>
                            <video
                                ref={instance => {
                                    provideMediaRef(clientID, instance)
                                }}
                                autoPlay
                                playsInline
                                muted={clientID === LOCAL_VIDEO}
                            />
                        </div>
                    )
                })
            }
        </MainLayout>
    )
}

export const getServerSideProps = ( context: GetServerSidePropsContext ) => {
    const { params } = context;

    return {
        props: {
            roomID: params?.id
        }
    };
}

export default Room;