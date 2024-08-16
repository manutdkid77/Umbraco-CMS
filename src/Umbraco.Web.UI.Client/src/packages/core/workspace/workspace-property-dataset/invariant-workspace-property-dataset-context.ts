import type { UmbPropertyDatasetContext, UmbNameablePropertyDatasetContext } from '@umbraco-cms/backoffice/property';
import { UMB_PROPERTY_DATASET_CONTEXT } from '@umbraco-cms/backoffice/property';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbVariantId } from '@umbraco-cms/backoffice/variant';
import type { UmbInvariantDatasetWorkspaceContext } from '@umbraco-cms/backoffice/workspace';

/**
 * A property dataset context that hooks directly into the workspace context.
 */
export class UmbInvariantWorkspacePropertyDatasetContext<
		WorkspaceType extends UmbInvariantDatasetWorkspaceContext = UmbInvariantDatasetWorkspaceContext,
	>
	extends UmbContextBase<UmbPropertyDatasetContext>
	implements UmbPropertyDatasetContext, UmbNameablePropertyDatasetContext
{
	#workspace: WorkspaceType;

	name;

	// default data:

	getVariantId() {
		return UmbVariantId.CreateInvariant();
	}
	getEntityType() {
		return this.#workspace.getEntityType();
	}
	getUnique() {
		return this.#workspace.getUnique();
	}
	getName() {
		return this.#workspace.getName();
	}
	setName(name: string) {
		this.#workspace.setName(name);
	}

	constructor(host: UmbControllerHost, workspace: WorkspaceType) {
		super(host, UMB_PROPERTY_DATASET_CONTEXT);
		this.#workspace = workspace;

		this.name = this.#workspace.name;
	}

	/**
	 * @function propertyValueByAlias
	 * @param {string} propertyAlias
	 * @returns {Promise<Observable<ReturnType | undefined> | undefined>}
	 * @description Get an Observable for the value of this property.
	 */
	async propertyValueByAlias<ReturnType = unknown>(propertyAlias: string) {
		return await this.#workspace.propertyValueByAlias<ReturnType>(propertyAlias);
	}

	/**
	 * TODO: Write proper JSDocs here.
	 * @param propertyAlias
	 * @param value
	 */
	async setPropertyValue(propertyAlias: string, value: unknown) {
		return this.#workspace.setPropertyValue(propertyAlias, value);
	}
}
