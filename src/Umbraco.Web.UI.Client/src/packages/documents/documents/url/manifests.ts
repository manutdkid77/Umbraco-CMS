import { manifests as infoAppManifests } from './info-app/manifests.js';
import { manifests as repositoryManifests } from './repository/manifests.js';

export const manifests: Array<UmbExtensionManifest> = [...repositoryManifests, ...infoAppManifests];
