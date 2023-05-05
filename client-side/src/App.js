import logo from './logo.svg';
import MainPage from './elements/mainPage'; 
import JoinRoom from './elements/joinRoom';
import './App.css';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <>
        <div className="App">
          <Routes>
              <Route path="/" element={<MainPage></MainPage>}></Route>
              <Route path="/room/:id" element={<JoinRoom></JoinRoom>}></Route>
              <Route path="/room/" element={<JoinRoom></JoinRoom>}></Route>
          </Routes>
        </div>
        {/* <div name="background">
    
          
        </div> */}
      
    </>);
}

export default App;
