import { umbExtensionsRegistry } from '../../registry.js';
import type { UmbExtensionCollectionFilterModel } from '../types.js';
import { UmbRepositoryBase } from '@umbraco-cms/backoffice/repository';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { UmbCollectionRepository } from '@umbraco-cms/backoffice/collection';

export class UmbExtensionCollectionRepository extends UmbRepositoryBase implements UmbCollectionRepository {
	constructor(host: UmbControllerHost) {
		super(host);
	}

	async requestCollection(query: UmbExtensionCollectionFilterModel) {
		let extensions = umbExtensionsRegistry.getAllExtensions();

		const skip = query.skip || 0;
		const take = query.take || 100;

		if (query.filter) {
			const text = query.filter.toLowerCase();
			extensions = extensions.filter(
				(x) => x.name.toLowerCase().includes(text) || x.alias.toLowerCase().includes(text),
			);
		}

		if (query.type) {
			extensions = extensions.filter((x) => x.type === query.type);
		}

		extensions.sort((a, b) => a.type.localeCompare(b.type) || a.alias.localeCompare(b.alias));

		const total = extensions.length;
		const items = extensions.slice(skip, skip + take);
		const data = { items, total };
		return { data };
	}

	destroy(): void {}
}

export { UmbExtensionCollectionRepository as api };
