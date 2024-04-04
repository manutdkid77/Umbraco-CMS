import type { UmbRollbackModalData, UmbRollbackModalValue } from './rollback-modal.token.js';
import { UmbRollbackRepository } from './repository/rollback.repository.js';
import { css, customElement, html, repeat, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbModalBaseElement } from '@umbraco-cms/backoffice/modal';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';

import '../shared/document-variant-language-picker.element.js';
import { UmbUserItemRepository } from '@umbraco-cms/backoffice/user';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '../../workspace/index.js';
import { UMB_DOCUMENT_PROPERTY_DATASET_CONTEXT } from '../../property-dataset-context/document-property-dataset-context.token.js';
import { UMB_PROPERTY_DATASET_CONTEXT } from '@umbraco-cms/backoffice/property';

type DocumentVersion = {
	id: string;
	date: string;
	user: string;
	isCurrentlyPublishedVersion: boolean;
	preventCleanup: boolean;
};

@customElement('umb-rollback-modal')
export class UmbRollbackModalElement extends UmbModalBaseElement<UmbRollbackModalData, UmbRollbackModalValue> {
	@state()
	versions: DocumentVersion[] = [];

	@state()
	currentVersion?: {
		date: string;
		name: string;
		user: string;
		id: string;
		properties: {
			alias: string;
			value: string;
		}[];
	};

	#rollbackRepository = new UmbRollbackRepository(this);
	#userItemRepository = new UmbUserItemRepository(this);

	#propertyDatasetContext?: typeof UMB_PROPERTY_DATASET_CONTEXT.TYPE;

	#documentId?: string | undefined;
	#documentCulture?: string | undefined;

	constructor() {
		super();

		this.consumeContext(UMB_PROPERTY_DATASET_CONTEXT, (instance) => {
			this.#propertyDatasetContext = instance;
			this.#requestVersions();
		});
	}

	async #requestVersions() {
		if (!this.#propertyDatasetContext) return;

		const documentId = this.#propertyDatasetContext.getUnique();
		const documentCulture = this.#propertyDatasetContext.getVariantId().culture;

		if (!documentId || !documentCulture) return;

		const { data } = await this.#rollbackRepository.requestVersionsByDocumentId(documentId, documentCulture);

		const tempItems: DocumentVersion[] = [];

		const uniqueUserIds = [...new Set(data?.items.map((item) => item.user.id))];

		const { data: userItems } = await this.#userItemRepository.requestItems(uniqueUserIds);

		data?.items.forEach((item: any) => {
			tempItems.push({
				date: item.versionDate,
				user: userItems?.find((user) => user.unique === item.user.id)?.name || '',
				isCurrentlyPublishedVersion: item.isCurrentPublishedVersion,
				id: item.id,
				preventCleanup: item.preventCleanup,
			});
		});

		this.versions = tempItems;
		const id = tempItems.find((item) => item.isCurrentlyPublishedVersion)?.id;

		if (id) {
			this.#setCurrentVersion(id);
		}
	}

	async #setCurrentVersion(id: string) {
		const version = this.versions.find((item) => item.id === id);
		if (!version) return;

		const { data } = await this.#rollbackRepository.requestVersionById(id);
		if (!data) return;

		this.currentVersion = {
			date: version.date || '',
			user: version.user,
			name: data.variants[0].name,
			id: data.id,
			properties: data.values.map((value: any) => {
				return {
					alias: value.alias,
					value: value.value,
				};
			}),
		};
	}

	#onRollback() {
		if (!this.currentVersion) return;

		const id = this.currentVersion.id;
		this.#rollbackRepository.rollback(id);

		this.modalContext?.reject();
	}

	#onCancel() {
		this.modalContext?.reject();
	}

	#onVersionClicked(id: string) {
		this.#setCurrentVersion(id);
	}

	#onPreventCleanup(event: Event, id: string, preventCleanup: boolean) {
		event.preventDefault();
		event.stopImmediatePropagation();
		this.#rollbackRepository.setPreventCleanup(id, preventCleanup);

		const version = this.versions.find((item) => item.id === id);
		if (!version) return;

		version.preventCleanup = preventCleanup;
		this.requestUpdate('versions');
	}

	#renderVersions() {
		return repeat(
			this.versions,
			(item) => item.id,
			(item) => {
				return html`
					<div
						@click=${() => this.#onVersionClicked(item.id)}
						@keydown=${() => {}}
						class="rollback-item ${this.currentVersion?.id === item.id ? 'active' : ''}">
						<div>
							<p class="rollback-item-date">
								<umb-localize-date date="${item.date}"></umb-localize-date>
							</p>
							<p>${item.user}</p>
							<p>${item.isCurrentlyPublishedVersion ? 'Current published version' : ''}</p>
						</div>
						<uui-button
							look="secondary"
							@click=${(event: Event) => this.#onPreventCleanup(event, item.id, !item.preventCleanup)}>
							${item.preventCleanup ? 'Enable cleanup' : 'Prevent cleanup'}
						</uui-button>
					</div>
				`;
			},
		);
	}

	#renderCurrentVersion() {
		if (!this.currentVersion) return;

		return html`
			<div>
				<p>name: ${this.currentVersion.name}</p>
				${repeat(
					this.currentVersion.properties,
					(item) => item.alias,
					(item) => {
						return html` <p>${item.alias}: ${JSON.stringify(item.value)}</p> `;
					},
				)}
			</div>
		`;
	}

	get currentVersionHeader() {
		return this.localize.date(this.currentVersion?.date || '') + ' - ' + this.currentVersion?.user;
	}

	render() {
		return html`
			<umb-body-layout headline="Rollback">
				<div id="main">
					<uui-box headline="Versions" id="box-left">
						<div>${this.#renderVersions()}</div>
					</uui-box>
					<uui-box headline=${this.currentVersionHeader} id="box-right"> ${this.#renderCurrentVersion()} </uui-box>
				</div>
				<umb-footer-layout slot="footer">
					<uui-button slot="actions" look="secondary" @click=${this.#onCancel}>Cancel</uui-button>
					<uui-button slot="actions" look="primary" @click=${this.#onRollback}>Rollback</uui-button>
				</umb-footer-layout>
			</umb-body-layout>
		`;
	}

	static styles = [
		UmbTextStyles,
		css`
			.rollback-item {
				position: relative;
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: var(--uui-size-space-5);
				cursor: pointer;
			}
			.rollback-item::after {
				content: '';
				position: absolute;
				inset: 2px;
				display: block;
				border: 2px solid transparent;
				pointer-events: none;
			}
			.rollback-item.active::after,
			.rollback-item:hover::after {
				border-color: var(--uui-color-selected);
			}
			.rollback-item:not(.active):hover::after {
				opacity: 0.5;
			}
			.rollback-item p {
				margin: 0;
				opacity: 0.5;
			}
			.rollback-item-date {
				opacity: 1;
			}
			.rollback-item uui-button {
				white-space: nowrap;
			}
			#main {
				display: flex;
				gap: var(--uui-size-space-4);
				width: 100%;
				height: 100%;
			}

			#box-left {
				--uui-box-default-padding: 0;
				max-width: 500px;
				flex: 1;
				overflow: auto;
				height: 100%;
			}

			#box-right {
				flex: 1;
				overflow: auto;
				height: 100%;
			}
		`,
	];
}

export default UmbRollbackModalElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-rollback-modal': UmbRollbackModalElement;
	}
}
