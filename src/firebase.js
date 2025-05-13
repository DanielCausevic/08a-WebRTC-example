import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {'apiKey': 'AIzaSyDNvUUfiOB1j6OaIh61zI9zeP7RP6nTDss', 'authDomain': 'webrtcproject-43cdd.firebaseapp.com', 'projectId': 'webrtcproject-43cdd', 'storageBucket': 'webrtcproject-43cdd.firebasestorage.app', 'messagingSenderId': '135465167438', 'appId': '1:135465167438:web:686fdacb1af12f2c8d711f'};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export default firestore;
