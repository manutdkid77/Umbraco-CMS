import type { ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const UMB_DOCUMENT_SAVE_MODAL_ALIAS = 'Umb.Modal.DocumentSave';
export const UMB_DOCUMENT_PUBLISH_MODAL_ALIAS = 'Umb.Modal.DocumentPublish';
export const UMB_DOCUMENT_UNPUBLISH_MODAL_ALIAS = 'Umb.Modal.DocumentUnpublish';
export const UMB_DOCUMENT_SCHEDULE_MODAL_ALIAS = 'Umb.Modal.DocumentSchedule';

const modals: Array<ManifestModal> = [
	{
		type: 'modal',
		alias: UMB_DOCUMENT_SAVE_MODAL_ALIAS,
		name: 'Document Save Modal',
		js: () => import('./save-modal/document-save-modal.element.js'),
	},
	{
		type: 'modal',
		alias: UMB_DOCUMENT_PUBLISH_MODAL_ALIAS,
		name: 'Document Publish Modal',
		js: () => import('./publish-modal/document-publish-modal.element.js'),
	},
	{
		type: 'modal',
		alias: UMB_DOCUMENT_UNPUBLISH_MODAL_ALIAS,
		name: 'Document Unpublish Modal',
		js: () => import('./unpublish-modal/document-unpublish-modal.element.js'),
	},
	{
		type: 'modal',
		alias: UMB_DOCUMENT_SCHEDULE_MODAL_ALIAS,
		name: 'Document Schedule Modal',
		js: () => import('./schedule-modal/document-schedule-modal.element.js'),
	},
];

export const manifests = [...modals];
