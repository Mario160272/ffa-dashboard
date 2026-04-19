import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import SessionMatch from './pages/SessionMatch'
import SessionTraining from './pages/SessionTraining'
import WeekAnalysis from './pages/WeekAnalysis'
import Prediction from './pages/Prediction'
import ControleCharge from './pages/ControleCharge'
import Repartition from './pages/Repartition'
import Presences from './pages/Presences'
import Testing from './pages/Testing'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/session-match" element={<SessionMatch />} />
        <Route path="/session-training" element={<SessionTraining />} />
        <Route path="/week-analysis" element={<WeekAnalysis />} />
        <Route path="/prediction" element={<Prediction />} />
        <Route path="/controle-charge" element={<ControleCharge />} />
        <Route path="/repartition" element={<Repartition />} />
        <Route path="/presences" element={<Presences />} />
        <Route path="/testing" element={<Testing />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
