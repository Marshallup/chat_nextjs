import type { NextPage } from 'next';
import React, { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ACTIONS } from "@/utils/ACTIONS_ROOMS";
import { v4 } from 'uuid';
import ChatSocket from "@/services/socket";
import MainLayout from '@/layouts/MainLayout';

const Home: NextPage = () => {
    const [ rooms, setRooms ] = useState([]);
    const router = useRouter();
    const rootNode = useRef<HTMLUListElement>(null);

    useEffect(() => {
        ChatSocket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] } = {}) => {
            if (rootNode.current) {
                setRooms(rooms);
            }
        })

    }, []);

    return (
        <MainLayout>

            <h1>Available rooms</h1>

            <ul ref={rootNode}>

                { rooms.map(roomID => (
                    <li key={roomID}>
                        { roomID }

                        <button
                            onClick={() => {
                                router.push(`/rooms/${roomID}`)
                            }}
                        >
                            JOIN ROOM
                        </button>
                    </li>
                ))}

            </ul>

            <button
                onClick={() => {
                    router.push(`/rooms/${v4()}`)
                }}
            >
                create new room
            </button>

        </MainLayout>
  )
}

export default Home
