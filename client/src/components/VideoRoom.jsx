import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { VideoPlayer } from './VideoPlayer';

const APP_ID = process.env.REACT_APP_AGORA_APP_ID

const client = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

export const VideoRoom = ({token, channel}) => {
  console.log(APP_ID, token, channel)
  const [users, setUsers] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);

  const handleUserJoined = async (user, mediaType) => {
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
      setUsers((previousUsers) => [...previousUsers, user]);
    }

    if (mediaType === 'audio') {
      // user.audioTrack.play()
    }
  };

  const handleUserLeft = (user) => {
    setUsers((previousUsers) =>
      previousUsers.filter((u) => u.uid !== user.uid)
    );
  };

  useEffect(() => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    client
      .join(APP_ID, channel, token, null)
      .then((uid) =>
        Promise.all([
          AgoraRTC.createMicrophoneAndCameraTracks(),
          uid,
        ])
      )
      .then(([tracks, uid]) => {
        const [audioTrack, videoTrack] = tracks;
        setLocalTracks(tracks);
        setUsers((previousUsers) => [
          ...previousUsers,
          {
            uid,
            videoTrack,
            audioTrack,
          },
        ]);
        client.publish(tracks);
      });

    return () => {
      for (let localTrack of localTracks) {
        if (localTrack) {
          localTrack.stop();
          localTrack.close();
        }
      }
      client.off('user-published', handleUserJoined);
      client.off('user-left', handleUserLeft);
      client.unpublish(localTracks).then(() => client.leave());
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/check-switch-camera', {
        method: 'GET',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        })
        .then(response => {
          console.log('Response:', response);
          return response.json();
        })
        .then(data => {
          console.log('Camera switch status:', data.switched);
          // Here you can update the state or perform any other actions based on the camera switch status
        })
        .catch(error => console.error('Error checking camera switch status:', error));
    }, 500); // Adjust the interval as needed, here it's set to check every 5 seconds
  
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);
  
  

  return (
    <div className='flex justify-center items-center'>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 300px)',
        }}
      >
        {users.map((user) => (
          <VideoPlayer 
            key={user.uid} 
            user={user} 
            isLocalUser={user.uid === client.uid}
          />
        ))}
      </div>
      <div className='absolute bottom-[78px] start-0'>
        <p className='truncate w-[400px] cursor-pointer' onClick={() => {navigator.clipboard.writeText(channel)}}>
          Call ID: {channel}
        </p>
        <p className='truncate w-[400px] cursor-pointer' onClick={() => {navigator.clipboard.writeText(token)}}>
          Call Token: {token}
        </p>
      </div>
    </div>
  );
};