import React from 'react'
import VideoCall from '../helpers/simple-peer'
import '../styles/video.css'
import io from 'socket.io-client'
import { getDisplayStream } from '../helpers/media-access';
import ShareScreenIcon from './ShareScreenIcon';



class Video extends React.Component {
  constructor() {
    super()
    this.state = {
      localStream: {},
      remoteStreamUrl: '',
      streamUrl: '',
      initiator: false,
      peer: {},
      full: false,
      connecting: false,
      waiting: true
    }
  }


  videoCall = new VideoCall()
  componentDidMount() {
    // const socket = io(process.env.REACT_APP_SIGNALING_SERVER)
    const socket = io(process.env.REACT_APP_SIGNALING_SERVER,  {
  path: '/socket.io/v1/stream/init'
});
socket.connect()

// const socket1 = io(process.env.REACT_APP_SIGNALING_SERVER, {
//   path: '/socket.io/v1/stream/accept',stream : 12, sdpOffer : {}, video  : true, audio : true
// });
    // setTimeout(() => {
    //   if (data.type === 'offer' && component.state.initiator) return
    //   if (data.type === 'answer' && !component.state.initiator) return
    //   component.call(data)      

    // }, 2000);
    const component = this
    this.setState({ socket })
    const { roomId } = this.props.match.params
    // socket.emit('join', ////{ roomId: roomId })
    // socket.emit('join', { roomId: roomId });

    // socket.emit('/stream/init', {guest: roomId});
    // this.getUserMedia().then(() => {
    //   console.log("get user media")
    //   socket.emit('join', { roomId: roomId })
    // })
    
    // const socket3 = io(process.env.REACT_APP_SIGNALING_SERVER, {
    //   path: '/socket.io/v1/publisher/watch',stream : "SNzNWKiRprQWQEisAAK9", publisherId :"WyFtTdo8444"
    // });
// const socket3 = io(process.env.REACT_APP_SIGNALING_SERVER)
 
      // io.use((socket, next) => {
      //   let token = socket.handshake.query;
      //     console.log(token, "token is working");
      // });
    // const socket4 = io(process.env.REACT_APP_SIGNALING_SERVER, {
    //   path: '/socket.io/v1/stream/reject',stream : 12
    // });
    // const socket4 = io(process.env.REACT_APP_SIGNALING_SERVER, {
    //   path: '/socket.io/v1/stream/reject',stream : 12
    // });
  

    socket.on('disconnect', (data) => {
      console.log('error  started')
      console.log("disconnected", data);
      console.log('error  ended');
    });

    socket.on('connect', () => {
      console.log('init');
      // component.setState({ initiator: true })
    })
    socket.on('init', () => {
      console.log('init');
      component.setState({ initiator: true })
    })
    socket.on('ready', () => {
      console.log('ready');
      component.enter(roomId)
    })
    socket.on('desc', data => {
      console.log('desc');
      if (data.type === 'offer' && component.state.initiator) return
      if (data.type === 'answer' && !component.state.initiator) return
      component.call(data)
    })
    socket.on('disconnected', () => {
      console.log('disconnect');
      component.setState({ initiator: true })
    })
    socket.on('full', () => {
      console.log('full');
      component.setState({ full: true })
    })
  }
  getUserMedia(cb) {
    console.log("getusermedia")
    return new Promise((resolve, reject) => {
      console.log("resolved")
      navigator.getUserMedia = navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia
      const op = {
        video: {
          width: { min: 160, ideal: 640, max: 1280 },
          height: { min: 120, ideal: 360, max: 720 }
        },
        audio: true
      }
      navigator.getUserMedia(
        op,
        stream => {
          this.setState({ streamUrl: stream, localStream: stream })
          this.localVideo.srcObject = stream
          resolve()
        },
        () => {}
      )
    })
  }
  getDisplay(){
    getDisplayStream().then(stream => {
      stream.oninactive = () => {
        this.state.peer.removeStream(this.state.localStream)  
        this.getUserMedia().then(() => {
          console.log("this.getUserMedia(")
          this.state.peer.addStream(this.state.localStream)  
        })
      }
      this.setState({ streamUrl: stream, localStream: stream })
      this.localVideo.srcObject = stream   
      console.log('peer')
      this.state.peer && this.state.peer.addStream(stream)  
      console.log('peerSuccessful')
    })
  }


  enter = roomId => {
    this.setState({ connecting: true })
    const peer = this.videoCall.init(
      this.state.localStream,
      this.state.initiator
    )
    this.setState({peer})
    
    peer.on('signal', data => {
      const signal = {
        room: roomId,
        desc: data
      }
      this.state.socket.emit('signal', signal)
    })
    peer.on('stream', stream => {
      this.remoteVideo.srcObject = stream
      this.setState({ connecting: false, waiting: false })
    })
    peer.on('error', function(err) {
      console.log(err)
    })
  }
  call = otherId => {
    this.videoCall.connect(otherId)
  }
  renderFull = () => {
    if (this.state.full) {
      return 'The room is full'
    }
  }
  render() {
    return (
      <div className="video-wrapper">
        <div className="local-video-wrapper">
          <video
            autoPlay
            id="localVideo"
            muted
            ref={video => (this.localVideo = video)}
          />
        </div>
        <video
          autoPlay
          className={`${
            this.state.connecting || this.state.waiting ? 'hide' : ''
          }`}
          id="remoteVideo"
          ref={video => (this.remoteVideo = video)}
        />
        <button className="share-screen-btn" onClick={() => {
          this.getDisplay()
        }}><ShareScreenIcon/></button>
        {this.state.connecting && (
          <div className="status">
            <p>Establishing connection...</p>
          </div>
        )}
        {this.state.waiting && (
          <div className="status">
            <p>Waiting for someone...</p>
          </div>
        )}
        {this.renderFull()}
      </div>
    )
  }
}

export default Video
