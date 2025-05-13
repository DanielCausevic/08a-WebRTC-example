import firestore from './firebase.js';
import './style.css';
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";

const startBtn = document.getElementById('startBtn');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const hangupBtn = document.getElementById('hangupBtn');
const callInput = document.getElementById('callInput');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const servers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  iceCandidatePoolSize: 10,
};

let pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = new MediaStream();

localVideo.srcObject = localStream;
remoteVideo.srcObject = remoteStream;

startBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  localVideo.srcObject = localStream;

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
    remoteVideo.srcObject = remoteStream;
  };
};

createBtn.onclick = async () => {
  const callDoc = doc(firestore, "calls", crypto.randomUUID());

  callInput.value = callDoc.id;

  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await updateDoc(callDoc, { offerCandidate: event.candidate.toJSON() });
    }
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
  await setDoc(callDoc, { offer });

  onSnapshot(callDoc, async (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDesc = new RTCSessionDescription(data.answer);
      await pc.setRemoteDescription(answerDesc);
    }
  });
};

joinBtn.onclick = async () => {
  const callId = callInput.value;
  const callDoc = doc(firestore, "calls", callId);
  const callData = (await getDoc(callDoc)).data();

  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await updateDoc(callDoc, { answerCandidate: event.candidate.toJSON() });
    }
  };

  const offerDesc = new RTCSessionDescription(callData.offer);
  await pc.setRemoteDescription(offerDesc);

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
  await updateDoc(callDoc, { answer });
};

hangupBtn.onclick = () => {
  pc.close();
  localStream.getTracks().forEach(track => track.stop());
  remoteStream.getTracks().forEach(track => track.stop());
  window.location.reload();
};
