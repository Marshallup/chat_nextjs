import type { NextPage, GetServerSidePropsContext } from 'next';
import useWebRTC, { LOCAL_VIDEO } from '@/hooks/useWebRTC';
import MainLayout from '@/layouts/MainLayout';
import { VideoRoomIDBody, VideoRoomElement, VideoRoomElementWrap } from '@/styles/pages/roomID';

function layout(clientsNumber = 1): { width: string, height: string }[] {

    const pairs: Array<undefined[]> = Array.from<undefined>({length: clientsNumber})
      .reduce((acc: Array<undefined[]>, next, index, arr) => {
        if (index % 2 === 0) {
            acc.push(arr.slice(index, index + 2));
        }
        
        return acc;
      }, []);
    const rowsNumber = pairs.length;
    const height = `${100 / rowsNumber}%`;
  
    return pairs.map((row, index, arr) => {
  
      if (index === arr.length - 1 && row.length === 1) {
        return [{
          width: '100%',
          height,
        }];
      }
  
      return row.map(() => ({
        width: '50%',
        height,
      }));
      
    }).flat();
}

const Room: NextPage<{ roomID: string }> = ({ roomID }) => {
    
    const {
        clients,
        provideMediaRef,
    } = useWebRTC(roomID);
    const videoLayout = layout(clients.length);
    
    return (
        <MainLayout>
            <VideoRoomIDBody>
                {
                    clients.map((clientID, idx) => {
                        return (
                            <VideoRoomElementWrap
                                key={clientID}
                                id={clientID}
                                style={videoLayout[idx]}
                            >
                                <VideoRoomElement
                                    ref={instance => { provideMediaRef(clientID, instance); }}
                                    width="100%"
                                    height="100%"
                                    autoPlay
                                    playsInline
                                    muted={clientID === LOCAL_VIDEO}
                                />
                            </VideoRoomElementWrap>
                        )
                    })
                }
            </VideoRoomIDBody>
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