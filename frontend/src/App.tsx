import './App.css'
import { BrowserRouter,Route,Routes } from 'react-router-dom'
import Sender from './pages/Sender'
import Reciever from './pages/Reciever'
function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path = "/sender" element = {<Sender/>}/>
      <Route path = "/reciever" element = {<Reciever/>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App
