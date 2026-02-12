import ExpoModulesCore
import WidgetKit

public class ExpoWidgetsModule: Module {
  private let appGroupId = "group.com.shin27.psycle.expowidgets"
  private let payloadKey = "psycle_widget_payload"

  public func definition() -> ModuleDefinition {
    Name("ExpoWidgets")

    Function("setWidgetData") { (data: String) -> Void in
      let defaults = UserDefaults(suiteName: self.appGroupId)
      defaults?.set(data, forKey: self.payloadKey)
      defaults?.set(Date().timeIntervalSince1970, forKey: "\(self.payloadKey)_updated_at")

      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
