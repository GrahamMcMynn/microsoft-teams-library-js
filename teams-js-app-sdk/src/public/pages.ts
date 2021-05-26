import { sendMessageToParent } from '../internal/communication';
import { registerHandler } from '../internal/handlers';
import { ensureInitialized } from '../internal/internalAPIs';
import { getGenericOnCompleteHandler } from '../internal/utils';
import { FrameContexts } from './constants';
import { FrameInfo, TabInformation, TabInstance, TabInstanceParameters } from './interfaces';
import { core } from './publicAPIs';
import { runtime } from './runtime';

export namespace pages {
  /**
   * Navigation specific part of the SDK.
   */
  /**
   * Return focus to the main teamsjs app. Will focus search bar if navigating forward and app bar if navigating back.
   * @param navigateForward Determines the direction to focus in teamsjs app.
   */
  export function returnFocus(navigateForward?: boolean): void {
    ensureInitialized(FrameContexts.content);

    sendMessageToParent('returnFocus', [navigateForward]);
  }

  export function setCurrentFrame(frameInfo: FrameInfo): void {
    ensureInitialized(FrameContexts.content);
    sendMessageToParent('setFrameContext', [frameInfo]);
  }

  export function initializeWithFrameContext(
    frameInfo: FrameInfo,
    callback?: () => void,
    validMessageOrigins?: string[],
  ): void {
    core.initialize(callback, validMessageOrigins);
    setCurrentFrame(frameInfo);
  }

  /**
   * Navigates the frame to a new cross-domain URL. The domain of this URL must match at least one of the
   * valid domains specified in the validDomains block of the manifest; otherwise, an exception will be
   * thrown. This function needs to be used only when navigating the frame to a URL in a different domain
   * than the current one in a way that keeps the app informed of the change and allows the SDK to
   * continue working.
   * @param url The URL to navigate the frame to.
   */
  export function navigateCrossDomain(url: string, onComplete?: (status: boolean, reason?: string) => void): void {
    ensureInitialized(
      FrameContexts.content,
      FrameContexts.sidePanel,
      FrameContexts.settings,
      FrameContexts.remove,
      FrameContexts.task,
      FrameContexts.stage,
      FrameContexts.meetingStage,
    );

    const errorMessage =
      'Cross-origin navigation is only supported for URLs matching the pattern registered in the manifest.';
    sendMessageToParent(
      'navigateCrossDomain',
      [url],
      onComplete ? onComplete : getGenericOnCompleteHandler(errorMessage),
    );
  }

  /**
   * Registers a handler for changes from or to full-screen view for a tab.
   * Only one handler can be registered at a time. A subsequent registration replaces an existing registration.
   * @param handler The handler to invoke when the user toggles full-screen view for a tab.
   */
  export function registerFullScreenHandler(handler: (isFullScreen: boolean) => void): void {
    ensureInitialized();
    registerHandler('fullScreenChange', handler);
  }

  /**
   * Registers a handler for clicking the app button.
   * Only one handler can be registered at a time. A subsequent registration replaces an existing registration.
   * @param handler The handler to invoke when the personal app button is clicked in the app bar.
   */
  export function registerAppButtonClickHandler(handler: () => void): void {
    ensureInitialized(FrameContexts.content);
    registerHandler('appButtonClick', handler);
  }

  /**
   * Registers a handler for entering hover of the app button.
   * Only one handler can be registered at a time. A subsequent registration replaces an existing registration.
   * @param handler The handler to invoke when entering hover of the personal app button in the app bar.
   */
  export function registerAppButtonHoverEnterHandler(handler: () => void): void {
    ensureInitialized(FrameContexts.content);
    registerHandler('appButtonHoverEnter', handler);
  }

  /**
   * Registers a handler for exiting hover of the app button.
   * Only one handler can be registered at a time. A subsequent registration replaces an existing registration.
   * @param handler The handler to invoke when exiting hover of the personal app button in the app bar.
   */
  export function registerAppButtonHoverLeaveHandler(handler: () => void): void {
    ensureInitialized(FrameContexts.content);
    registerHandler('appButtonHoverLeave', handler);
  }

  /**
   * Checks if page capability is supported currently
   */
  export function isSupported(): boolean {
    return runtime.supports.pages ? true : false;
  }

  /**
   * Namespace to interact with the teams specific part of the SDK.
   */
  export namespace tabs {
    /**
     * Navigates the Microsoft teamsjs app to the specified tab instance.
     * @param tabInstance The tab instance to navigate to.
     */
    export function navigateToTab(
      tabInstance: TabInstance,
      onComplete?: (status: boolean, reason?: string) => void,
    ): void {
      ensureInitialized();

      const errorMessage = 'Invalid internalTabInstanceId and/or channelId were/was provided';
      sendMessageToParent(
        'navigateToTab',
        [tabInstance],
        onComplete ? onComplete : getGenericOnCompleteHandler(errorMessage),
      );
    }
    /**
     * Allows an app to retrieve for this user tabs that are owned by this app.
     * If no TabInstanceParameters are passed, the app defaults to favorite teams and favorite channels.
     * @param callback The callback to invoke when the {@link TabInstanceParameters} object is retrieved.
     * @param tabInstanceParameters OPTIONAL Flags that specify whether to scope call to favorite teams or channels.
     */
    export function getTabInstances(
      callback: (tabInfo: TabInformation) => void,
      tabInstanceParameters?: TabInstanceParameters,
    ): void {
      ensureInitialized();

      sendMessageToParent('getTabInstances', [tabInstanceParameters], callback);
    }

    /**
     * Allows an app to retrieve the most recently used tabs for this user.
     * @param callback The callback to invoke when the {@link TabInformation} object is retrieved.
     * @param tabInstanceParameters OPTIONAL Ignored, kept for future use
     */
    export function getMruTabInstances(
      callback: (tabInfo: TabInformation) => void,
      tabInstanceParameters?: TabInstanceParameters,
    ): void {
      ensureInitialized();

      sendMessageToParent('getMruTabInstances', [tabInstanceParameters], callback);
    }

    /**
     * Checks if pages.tabs capability is supported currently
     */
    export function isSupported(): boolean {
      return runtime.supports.pages ? (runtime.supports.pages.tabs ? true : false) : false;
    }
  }
  /**
   * Namespace to interact with the config-specific part of the SDK.
   * This object is usable only on the config frame.
   */
  export namespace config {
    let saveHandler: (evt: SaveEvent) => void;
    let removeHandler: (evt: RemoveEvent) => void;

    export function initialize(): void {
      registerHandler('settings.save', handleSave, false);
      registerHandler('settings.remove', handleRemove, false);
    }

    /**
     * Sets the validity state for the config.
     * The initial value is false, so the user cannot save the config until this is called with true.
     * @param validityState Indicates whether the save or remove button is enabled for the user.
     */
    export function setValidityState(validityState: boolean): void {
      ensureInitialized(FrameContexts.settings, FrameContexts.remove);
      sendMessageToParent('settings.setValidityState', [validityState]);
    }

    /**
     * Gets the config for the current instance.
     * @param callback The callback to invoke when the {@link Config} object is retrieved.
     */
    export function getConfig(callback: (instanceSettings: Config) => void): void {
      ensureInitialized(FrameContexts.content, FrameContexts.settings, FrameContexts.remove, FrameContexts.sidePanel);
      sendMessageToParent('settings.getSettings', callback);
    }

    /**
     * Sets the config for the current instance.
     * This is an asynchronous operation; calls to getConfig are not guaranteed to reflect the changed state.
     * @param Config The desired config for this instance.
     */
    export function setConfig(instanceSettings: Config, onComplete?: (status: boolean, reason?: string) => void): void {
      ensureInitialized(FrameContexts.content, FrameContexts.settings, FrameContexts.sidePanel);
      sendMessageToParent(
        'settings.setSettings',
        [instanceSettings],
        onComplete ? onComplete : getGenericOnCompleteHandler(),
      );
    }

    /**
     * Registers a handler for when the user attempts to save the settings. This handler should be used
     * to create or update the underlying resource powering the content.
     * The object passed to the handler must be used to notify whether to proceed with the save.
     * Only one handler can be registered at a time. A subsequent registration replaces an existing registration.
     * @param handler The handler to invoke when the user selects the save button.
     */
    export function registerOnSaveHandler(handler: (evt: SaveEvent) => void): void {
      ensureInitialized(FrameContexts.settings);
      saveHandler = handler;
      handler && sendMessageToParent('registerHandler', ['save']);
    }

    /**
     * Registers a handler for user attempts to remove content. This handler should be used
     * to remove the underlying resource powering the content.
     * The object passed to the handler must be used to indicate whether to proceed with the removal.
     * Only one handler may be registered at a time. Subsequent registrations will override the first.
     * @param handler The handler to invoke when the user selects the remove button.
     */
    export function registerOnRemoveHandler(handler: (evt: RemoveEvent) => void): void {
      ensureInitialized(FrameContexts.remove, FrameContexts.settings);
      removeHandler = handler;
      handler && sendMessageToParent('registerHandler', ['remove']);
    }

    function handleSave(result?: SaveParameters): void {
      const saveEvent = new SaveEventImpl(result);
      if (saveHandler) {
        saveHandler(saveEvent);
      } else {
        // If no handler is registered, we assume success.
        saveEvent.notifySuccess();
      }
    }

    /**
     * Registers a handler for when the user reconfigurated tab
     * @param handler The handler to invoke when the user click on Settings.
     */
    export function registerChangeConfigHandler(handler: () => void): void {
      ensureInitialized(FrameContexts.content);
      registerHandler('changeSettings', handler);
    }

    export interface Config {
      /**
       * A suggested display name for the new content.
       * In the settings for an existing instance being updated, this call has no effect.
       */
      suggestedDisplayName?: string;
      /**
       * Sets the URL to use for the content of this instance.
       */
      contentUrl: string;
      /**
       * Sets the URL for the removal configuration experience.
       */
      removeUrl?: string;
      /**
       * Sets the URL to use for the external link to view the underlying resource in a browser.
       */
      websiteUrl?: string;
      /**
       * The developer-defined unique ID for the entity to which this content points.
       */
      entityId?: string;
    }

    export interface SaveEvent {
      /**
       * Object containing properties passed as arguments to the settings.save event.
       */
      result: SaveParameters;
      /**
       * Indicates that the underlying resource has been created and the config can be saved.
       */
      notifySuccess(): void;
      /**
       * Indicates that creation of the underlying resource failed and that the config cannot be saved.
       * @param reason Specifies a reason for the failure. If provided, this string is displayed to the user; otherwise a generic error is displayed.
       */
      notifyFailure(reason?: string): void;
    }

    export interface RemoveEvent {
      /**
       * Indicates that the underlying resource has been removed and the content can be removed.
       */
      notifySuccess(): void;
      /**
       * Indicates that removal of the underlying resource failed and that the content cannot be removed.
       * @param reason Specifies a reason for the failure. If provided, this string is displayed to the user; otherwise a generic error is displayed.
       */
      notifyFailure(reason?: string): void;
    }

    export interface SaveParameters {
      /**
       * Connector's webhook Url returned as arguments to settings.save event as part of user clicking on Save
       */
      webhookUrl?: string;
    }

    /**
     * @private
     * Hide from docs, since this class is not directly used.
     */
    class SaveEventImpl implements SaveEvent {
      public notified: boolean = false;
      public result: SaveParameters;
      public constructor(result?: SaveParameters) {
        this.result = result ? result : {};
      }
      public notifySuccess(): void {
        this.ensureNotNotified();
        sendMessageToParent('settings.save.success');
        this.notified = true;
      }
      public notifyFailure(reason?: string): void {
        this.ensureNotNotified();
        sendMessageToParent('settings.save.failure', [reason]);
        this.notified = true;
      }
      private ensureNotNotified(): void {
        if (this.notified) {
          throw new Error('The SaveEvent may only notify success or failure once.');
        }
      }
    }

    function handleRemove(): void {
      const removeEvent = new RemoveEventImpl();
      if (removeHandler) {
        removeHandler(removeEvent);
      } else {
        // If no handler is registered, we assume success.
        removeEvent.notifySuccess();
      }
    }

    /**
     * @private
     * Hide from docs, since this class is not directly used.
     */
    class RemoveEventImpl implements RemoveEvent {
      public notified: boolean = false;

      public notifySuccess(): void {
        this.ensureNotNotified();
        sendMessageToParent('settings.remove.success');
        this.notified = true;
      }

      public notifyFailure(reason?: string): void {
        this.ensureNotNotified();
        sendMessageToParent('settings.remove.failure', [reason]);
        this.notified = true;
      }

      private ensureNotNotified(): void {
        if (this.notified) {
          throw new Error('The removeEvent may only notify success or failure once.');
        }
      }
    }

    /**
     * Checks if pages.config capability is supported currently
     */
    export function isSupported(): boolean {
      return runtime.supports.pages ? (runtime.supports.pages.config ? true : false) : false;
    }
  }

  /**
   * Namespace to interact with the back-stack part of the SDK.
   */
  export namespace backStack {
    let backButtonPressHandler: () => boolean;

    export function _initialize(): void {
      registerHandler('backButtonPress', handleBackButtonPress, false);
    }

    /**
     * Navigates back in the teamsjs app. See registerBackButtonHandler for more information on when
     * it's appropriate to use this method.
     */
    export function navigateBack(onComplete?: (status: boolean, reason?: string) => void): void {
      ensureInitialized();

      const errorMessage = 'Back navigation is not supported in the current client or context.';
      sendMessageToParent('navigateBack', [], onComplete ? onComplete : getGenericOnCompleteHandler(errorMessage));
    }

    /**
     * Registers a handler for user presses of the Team client's back button. Experiences that maintain an internal
     * navigation stack should use this handler to navigate the user back within their frame. If an app finds
     * that after running its back button handler it cannot handle the event it should call the navigateBack
     * method to ask the Teams client to handle it instead.
     * @param handler The handler to invoke when the user presses their Team client's back button.
     */
    export function registerBackButtonHandler(handler: () => boolean): void {
      backButtonPressHandler = handler;
      handler && sendMessageToParent('registerHandler', ['backButton']);
    }

    function handleBackButtonPress(): void {
      if (!backButtonPressHandler || !backButtonPressHandler()) {
        navigateBack();
      }
    }

    /**
     * Checks if pages.backStack capability is supported currently
     */
    export function isSupported(): boolean {
      return runtime.supports.pages ? (runtime.supports.pages.backStack ? true : false) : false;
    }
  }

  export namespace fullTrust {
    /**
     * @private
     * Hide from docs
     * ------
     * Place the tab into full-screen mode.
     */
    export function enterFullscreen(): void {
      ensureInitialized(FrameContexts.content);
      sendMessageToParent('enterFullscreen', []);
    }

    /**
     * @private
     * Hide from docs
     * ------
     * Reverts the tab into normal-screen mode.
     */
    export function exitFullscreen(): void {
      ensureInitialized(FrameContexts.content);
      sendMessageToParent('exitFullscreen', []);
    }
    /**
     * Checks if pages.fullTrust capability is supported currently
     */
    export function isSupported(): boolean {
      return runtime.supports.pages ? (runtime.supports.pages.fullTrust ? true : false) : false;
    }
  }
}
