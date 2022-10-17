import { css, CSSResultGroup, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Subscription } from 'rxjs';

import { UmbInstallerContext } from '../installer.context';
import { UmbContextConsumerMixin } from '@umbraco-cms/context-api';
import type { TelemetryModel } from '@umbraco-cms/models';

@customElement('umb-installer-consent')
export class UmbInstallerConsentElement extends UmbContextConsumerMixin(LitElement) {
	static styles: CSSResultGroup = [
		css`
			:host,
			#container {
				display: flex;
				flex-direction: column;
				height: 100%;
			}

			uui-form {
				height: 100%;
			}

			form {
				height: 100%;
				display: flex;
				flex-direction: column;
			}

			h1 {
				text-align: center;
				margin-bottom: var(--uui-size-layout-3);
			}

			#buttons {
				display: flex;
				margin-top: auto;
			}

			#button-install {
				margin-left: auto;
				min-width: 120px;
			}
		`,
	];

	@state()
	private _telemetryLevels: TelemetryModel[] = [];

	@state()
	private _telemetryFormData?: TelemetryModel['level'];

	private _installerContext?: UmbInstallerContext;
	private _installerDataSubscription?: Subscription;
	private _installerSettingsSubscription?: Subscription;

	constructor() {
		super();

		this.consumeContext('umbInstallerContext', (installerContext: UmbInstallerContext) => {
			this._installerContext = installerContext;
			this._observeInstallerSettings();
			this._observeInstallerData();
		});
	}

	private _observeInstallerSettings() {
		this._installerSettingsSubscription?.unsubscribe();
		this._installerSettingsSubscription = this._installerContext?.settings.subscribe((settings) => {
			this._telemetryLevels = settings.user.consentLevels;
		});
	}

	private _observeInstallerData() {
		this._installerDataSubscription?.unsubscribe();
		this._installerDataSubscription = this._installerContext?.data.subscribe((data) => {
			this._telemetryFormData = data.telemetryLevel;
		});
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this._installerSettingsSubscription?.unsubscribe();
		this._installerDataSubscription?.unsubscribe();
	}

	private _handleChange(e: InputEvent) {
		const target = e.target as HTMLInputElement;

		const value: { [key: string]: string } = {};
		value[target.name] = this._telemetryLevels[parseInt(target.value) - 1].level;
		this._installerContext?.appendData(value);
	}

	private _onNext() {
		this._installerContext?.nextStep();
	}

	private _onBack() {
		this._installerContext?.prevStep();
	}

	private get _selectedTelemetryIndex() {
		return this._telemetryLevels?.findIndex((x) => x.level === this._telemetryFormData) ?? 0;
	}

	private get _selectedTelemetry() {
		return this._telemetryLevels?.find((x) => x.level === this._telemetryFormData) ?? this._telemetryLevels[0];
	}

	private _renderSlider() {
		if (!this._telemetryLevels || this._telemetryLevels.length < 1) return;

		return html`
			<uui-slider
				@input=${this._handleChange}
				name="telemetryLevel"
				label="telemetry-level"
				value=${this._selectedTelemetryIndex + 1}
				hide-step-values
				min="1"
				max=${this._telemetryLevels.length}></uui-slider>
			<h2>${this._selectedTelemetry.level}</h2>
			<!-- TODO: Is this safe to do? -->
			<p>${unsafeHTML(this._selectedTelemetry.description)}</p>
		`;
	}

	render() {
		return html`
			<div id="container" class="uui-text" data-test="installer-telemetry">
				<h1>Consent for telemetry data</h1>
				${this._renderSlider()}
				<div id="buttons">
					<uui-button label="Back" @click=${this._onBack} look="secondary"></uui-button>
					<uui-button id="button-install" @click=${this._onNext} label="Next" look="primary"></uui-button>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'umb-installer-consent': UmbInstallerConsentElement;
	}
}
