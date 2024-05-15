import type { UmbUserDetailModel } from '../../types.js';
import { UMB_USER_ENTITY_TYPE } from '../../entity.js';
import { UmbId } from '@umbraco-cms/backoffice/id';
import type { UmbDetailDataSource } from '@umbraco-cms/backoffice/repository';
import type { CreateUserRequestModel, UpdateUserRequestModel } from '@umbraco-cms/backoffice/external/backend-api';
import { UserService } from '@umbraco-cms/backoffice/external/backend-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources';

/**
 * A data source for the User that fetches data from the server
 * @export
 * @class UmbUserServerDataSource
 * @implements {RepositoryDetailDataSource}
 */
export class UmbUserServerDataSource implements UmbDetailDataSource<UmbUserDetailModel> {
	#host: UmbControllerHost;

	/**
	 * Creates an instance of UmbUserServerDataSource.
	 * @param {UmbControllerHost} host
	 * @memberof UmbUserServerDataSource
	 */
	constructor(host: UmbControllerHost) {
		this.#host = host;
	}

	/**
	 * Creates a new User scaffold
	 * @param {(string | null)} parentUnique
	 * @return { CreateUserRequestModel }
	 * @memberof UmbUserServerDataSource
	 */
	async createScaffold() {
		const data: UmbUserDetailModel = {
			avatarUrls: [],
			createDate: null,
			hasDocumentRootAccess: false,
			documentStartNodeUniques: [],
			email: '',
			entityType: UMB_USER_ENTITY_TYPE,
			failedLoginAttempts: 0,
			isAdmin: false,
			languageIsoCode: '',
			lastLockoutDate: null,
			lastLoginDate: null,
			lastPasswordChangeDate: null,
			hasMediaRootAccess: false,
			mediaStartNodeUniques: [],
			name: '',
			state: null,
			unique: UmbId.new(),
			updateDate: null,
			userGroupUniques: [],
			userName: '',
		};

		return { data };
	}

	/**
	 * Fetches a User with the given id from the server
	 * @param {string} unique
	 * @return {*}
	 * @memberof UmbUserServerDataSource
	 */
	async read(unique: string) {
		if (!unique) throw new Error('Unique is missing');

		const { data, error } = await tryExecuteAndNotify(this.#host, UserService.getUserById({ id: unique }));

		if (error || !data) {
			return { error };
		}

		// TODO: make data mapper to prevent errors
		const user: UmbUserDetailModel = {
			avatarUrls: data.avatarUrls,
			createDate: data.createDate,
			hasDocumentRootAccess: data.hasDocumentRootAccess,
			documentStartNodeUniques: data.documentStartNodeIds.map((node) => {
				return {
					unique: node.id,
				};
			}),
			email: data.email,
			entityType: UMB_USER_ENTITY_TYPE,
			failedLoginAttempts: data.failedLoginAttempts,
			isAdmin: data.isAdmin,
			languageIsoCode: data.languageIsoCode || null,
			lastLockoutDate: data.lastLockoutDate || null,
			lastLoginDate: data.lastLoginDate || null,
			lastPasswordChangeDate: data.lastPasswordChangeDate || null,
			hasMediaRootAccess: data.hasMediaRootAccess,
			mediaStartNodeUniques: data.mediaStartNodeIds.map((node) => {
				return {
					unique: node.id,
				};
			}),
			name: data.name,
			state: data.state,
			unique: data.id,
			updateDate: data.updateDate,
			userGroupUniques: data.userGroupIds,
			userName: data.userName,
		};

		return { data: user };
	}

	/**
	 * Inserts a new User on the server
	 * @param {UmbUserDetailModel} model
	 * @return {*}
	 * @memberof UmbUserServerDataSource
	 */
	async create(model: UmbUserDetailModel) {
		if (!model) throw new Error('User is missing');

		// TODO: make data mapper to prevent errors
		const requestBody: CreateUserRequestModel = {
			email: model.email,
			name: model.name,
			userGroupIds: model.userGroupUniques,
			userName: model.userName,
		};

		const { data, error } = await tryExecuteAndNotify(
			this.#host,
			UserService.postUser({
				requestBody,
			}),
		);

		if (data) {
			return this.read(data);
		}

		return { error };
	}

	/**
	 * Updates a User on the server
	 * @param {UmbUserDetailModel} User
	 * @return {*}
	 * @memberof UmbUserServerDataSource
	 */
	async update(model: UmbUserDetailModel) {
		if (!model.unique) throw new Error('Unique is missing');

		// TODO: make data mapper to prevent errors
		const requestBody: UpdateUserRequestModel = {
			documentStartNodeIds: model.documentStartNodeUniques.map((node) => {
				return {
					id: node.unique,
				};
			}),
			email: model.email,
			hasDocumentRootAccess: model.hasDocumentRootAccess,
			hasMediaRootAccess: model.hasMediaRootAccess,
			languageIsoCode: model.languageIsoCode || '',
			mediaStartNodeIds: model.mediaStartNodeUniques.map((node) => {
				return {
					id: node.unique,
				};
			}),
			name: model.name,
			userGroupIds: model.userGroupUniques,
			userName: model.userName,
		};

		const { error } = await tryExecuteAndNotify(
			this.#host,
			UserService.putUserById({
				id: model.unique,
				requestBody,
			}),
		);

		if (!error) {
			return this.read(model.unique);
		}

		return { error };
	}

	/**
	 * Deletes a User on the server
	 * @param {string} unique
	 * @return {*}
	 * @memberof UmbUserServerDataSource
	 */
	async delete(unique: string) {
		if (!unique) throw new Error('Unique is missing');

		return tryExecuteAndNotify(
			this.#host,
			UserService.deleteUserById({
				id: unique,
			}),
		);
	}
}
