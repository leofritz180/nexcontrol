'use client'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { isRedesign } from '../lib/redesign'
import { isNex2 } from '../lib/theme-v2'
import { useDadosDaPaleta } from '../lib/paletaDados'
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false })
const QuickNotifyPanel = dynamic(() => import('./QuickNotifyPanel'), { ssr: false })
const VoiceAnnounceCard = dynamic(() => import('./VoiceAnnounceCard'), { ssr: false })
const RedesignHeader = dynamic(() => import('./RedesignHeader'), { ssr: false })
const DockPilula = dynamic(() => import('./v2/DockPilula'), { ssr: false })
const BarraApp = dynamic(() => import('./v2/BarraApp'), { ssr: false })
const BemVindo20 = dynamic(() => import('./v2/BemVindo20'), { ssr: false })
const PaletaComandos = dynamic(() => import('./v2/PaletaComandos'), { ssr: false })
const Atalhos = dynamic(() => import('./v2/Atalhos'), { ssr: false })
const RailSelo = dynamic(() => import('./v2/RailSelo'), { ssr: false })
const VoiceBanner = dynamic(() => import('./VoiceBanner'), { ssr: false })
const BettifyPromo = dynamic(() => import('./BettifyPromo'), { ssr: false })
const NetworkLaunchBanner = dynamic(() => import('./NetworkLaunchBanner'), { ssr: false })
const NetworkDock = dynamic(() => import('./NetworkDock'), { ssr: false })
const PhoneGate = dynamic(() => import('./PhoneGate'), { ssr: false })

// A saída é mais curta que a entrada de propósito: o olho perdoa um corte
// rápido no que está saindo, mas estranha o que entra apressado.
//
// SÓ OPACIDADE — e isso não é economia, é requisito.
//
// `filter` e `transform` num ancestral trocam o bloco de contenção de tudo
// que é position:fixed lá dentro: o elemento passa a se posicionar por ESTE
// div, não pela janela. O y:16 some no fim (o Framer devolve transform:none),
// mas o blur NÃO: ele para em `filter: blur(0px)`, que continua sendo um
// filtro. O bloco de contenção ficava quebrado pra sempre.
//
// Foi o que derrubou o dock flutuante: ele é fixed, virava absolute dentro
// do conteúdo, ia parar no fim da página e sumia ao rolar. Valia também pros
// modais (components/ui/folha.js usa fixed/inset:0) e já tinha obrigado a
// excluir o /network deste wrapper, logo abaixo, pelo mesmo motivo.
const pageVariants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.34, ease: [0.33, 1, 0.68, 1] } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
}

export default function AppLayout({ children, userName, userEmail, isAdmin, tenant, subscription, userId, tenantId }) {
  // dados que a pagina atual emprestou pra busca do Ctrl+K
  const dadosPaleta = useDadosDaPaleta()
  const pathname = usePathname()

  return (
    <>
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        isAdmin={isAdmin}
        tenant={tenant}
        subscription={subscription}
        userId={userId}
        tenantId={tenantId}
      />
      <DockPilula ativo={isNex2(userEmail)} />
      <BarraApp ativo={isNex2(userEmail)} isAdmin={isAdmin} aoNovaMeta={dadosPaleta.aoNovaMeta} />
      <RailSelo ativo={isNex2(userEmail)} />
      <BemVindo20 email={userEmail} ativo={isNex2(userEmail)} />
      <PaletaComandos ativo={isNex2(userEmail)} isAdmin={isAdmin} {...dadosPaleta} />
      <Atalhos ativo={isNex2(userEmail)} isAdmin={isAdmin} aoNovaMeta={dadosPaleta.aoNovaMeta} />
      <div style={{ marginLeft: isRedesign(userEmail) ? 76 : 248 }} className="app-content">
        {/* Loja Proxy e Network: sem cabeçalho vermelho — imersão total (chat/loja) */}
        {isRedesign(userEmail) && !isNex2(userEmail) && pathname !== '/proxy' && pathname !== '/network' && <RedesignHeader />}
        {/* /network: sem wrapper animado (o transform quebraria o position:fixed do chat mobile) */}
        {pathname === '/network' ? (
          children
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              className="nx-pagina"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <QuickNotifyPanel userEmail={userEmail} />
      <VoiceAnnounceCard userEmail={userEmail} isAdmin={isAdmin} />
      <VoiceBanner userEmail={userEmail} />
      {/* Promo Bettify: PERMANENTE — 1x por sessão (todo login/abertura). Some nas telas da própria loja. */}
      {pathname !== '/proxy' && pathname !== '/minhas-proxies' && <BettifyPromo userEmail={userEmail} />}
      {pathname !== '/network' && <NetworkLaunchBanner userEmail={userEmail} isAdmin={isAdmin} subscription={subscription} tenant={tenant} />}
      {/* Reativado após upgrade Nano->Micro (08/07) com polling espaçado (90s) pra pegar leve no banco */}
      <NetworkDock userEmail={userEmail} isAdmin={isAdmin} subscription={subscription} tenant={tenant} />
      {/* Confirma WhatsApp de quem ainda nao tem (base existente; novos ja dao no signup) */}
      <PhoneGate />
      <style jsx global>{`
        @media (max-width: 768px) {
          .app-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}
