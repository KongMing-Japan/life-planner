import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LifeOS Planner failed to render', error, info)
  }

  private resetSavedPlan = () => {
    localStorage.removeItem('life-planner-v2')
    localStorage.removeItem('life-planner-v1')
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="app-recovery" role="alert">
        <span>LifeOS Planner</span>
        <h1>保存されたプランを読み込めませんでした</h1>
        <p>以前のデータ形式が現在のPlannerと合わない可能性があります。保存データをリセットすると、標準プランで開き直せます。</p>
        <button type="button" onClick={this.resetSavedPlan}>保存データをリセットして開く</button>
        <small>无法读取以前保存的计划时，可重置本地数据并重新打开。</small>
      </main>
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppErrorBoundary><App /></AppErrorBoundary></StrictMode>,
)
