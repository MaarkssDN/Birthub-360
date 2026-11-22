import UIKit
import Capacitor

// Resolve o deep link de esquema custom "birthhub360://<destino>" (ver CFBundleURLTypes em
// Info.plist) traduzindo o destino recebido pra uma navegação real dentro do WebView que o
// Capacitor já carregou (server.url, ver capacitor.config.ts) — contraparte iOS de
// android/app/src/main/java/br/com/birthhub360/prospector/MainActivity.java (mesma lista de destinos
// válidos, mesmo comportamento de erro visível para destino desconhecido; ver comentários lá para
// o raciocínio completo, incluindo o handoff aberto pro Agente 02 sobre a lista duplicada e sobre
// "enrich"/"prompts" não terem rota correspondente em src/App.tsx).
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    // Espelha ACTIVE_NAV_TABS de src/lib/navigationBus.ts (= TAB_ROUTE_SET menos
    // NAV_HIDDEN_TABS: voice-hub, outbound, dialer) — a mesma lista de VALID_TABS em
    // MainActivity.java (Android). Mantenha sincronizado manualmente sempre que o contrato
    // de navegação mudar; a paridade é verificada por
    // tests/unit/navigation/ios-valid-tabs-parity.test.ts (e android-valid-tabs-parity.test.ts).
    // Auditoria DEM-20261115-001: antes divergia do Android (~34 entradas, com
    // "sdr-diagnostic-joao" inexistente e sem crm360/propostas/forecast/settings_*).
    private static let validTabs: Set<String> = [
        "dashboard", "workspace", "companies", "contacts", "crm", "crm360", "mesa-tratamento",
        "activities", "cadence", "prospect", "signals-risks", "intelligence", "market-intelligence",
        "propostas", "chatbook", "roleplay", "qualification_matrix", "objections_matrix",
        "topic_training", "bitrix", "reports", "integrations", "knowledge", "analytics", "gamification", "winloss",
        "calendar", "notifications", "automations", "usage", "editor", "team", "settings",
        "commercial_intelligence", "copiloto_ia", "daily-plan", "sdr-diagnostic", "module-access",
        "forecast", "metas", "pipeline_ponderado", "playbooks", "jornadas", "processos", "roteiros",
        "settings_hub", "settings_market", "settings_sales", "settings_performance",
        "settings_predictability", "settings_ai", "settings_automation", "settings_engagement"
    ]

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)

        if let url = connectionOptions.urlContexts.first?.url {
            handleDeepLink(url)
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
        if let url = URLContexts.first?.url {
            handleDeepLink(url)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == "birthhub360" else { return }
        let tab = url.host ?? ""

        if tab.isEmpty || tab == "dashboard" {
            navigateWebView(to: "/app")
            return
        }
        if SceneDelegate.validTabs.contains(tab) {
            navigateWebView(to: "/app/\(tab)")
        } else {
            showInvalidDeepLinkError(tab: tab)
        }
    }

    private func navigateWebView(to path: String) {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let webView = bridgeVC.webView else { return }

        // A origem vem da configuração resolvida pelo próprio Capacitor
        // (InstanceConfiguration.serverURL = server.url de capacitor.config.ts,
        // resolvida em tempo de `cap sync`/build via CAPACITOR_SERVER_URL) — mesma
        // fonte que o Android usa em getBridge().getServerUrl(). Antes era a constante
        // hardcoded "https://birthhub-360.onrender.com", URL de backend desativado e
        // divergente do default atual (auditoria DEM-20261115-001, P1-2). Se server.url
        // não estiver configurado, serverURL cai no scheme local do Capacitor
        // (capacitor://localhost) — mesmo comportamento do caminho Android, que também
        // não tem fallback offline (ver P1-1 da auditoria).
        guard let serverURL = bridgeVC.bridge?.config.serverURL,
              let targetURL = URL(string: serverURL.absoluteString + path) else { return }
        DispatchQueue.main.async {
            webView.load(URLRequest(url: targetURL))
        }
    }

    // Bloqueador de design deste repositório (AGENTS.md do Agente 09): "deep link para destino
    // inexistente deve falhar de forma visível, nunca abrir tela em branco".
    private func showInvalidDeepLinkError(tab: String) {
        guard let presenter = window?.rootViewController else { return }
        DispatchQueue.main.async {
            let alert = UIAlertController(
                title: "Link inválido",
                message: "O destino \"\(tab)\" não existe no Birth Hub 360 Prospector. Verifique o link e tente novamente.",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            presenter.present(alert, animated: true)
        }
    }
}
