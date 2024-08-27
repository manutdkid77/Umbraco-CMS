import { UmbBlockGridEntriesContext } from '../../context/block-grid-entries.context.js';
import type { UmbBlockGridEntryElement } from '../block-grid-entry/index.js';
import {
	getAccumulatedValueOfIndex,
	getInterpolatedIndexOfPositionInWeightMap,
	isWithinRect,
} from '@umbraco-cms/backoffice/utils';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, state, repeat, css, property, nothing } from '@umbraco-cms/backoffice/external/lit';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import '../block-grid-entry/index.js';
import { UmbSorterController, type UmbSorterConfig, type resolvePlacementArgs } from '@umbraco-cms/backoffice/sorter';
import {
	UmbFormControlMixin,
	UmbFormControlValidator,
	type UmbFormControlValidatorConfig,
} from '@umbraco-cms/backoffice/validation';
import type { UmbNumberRangeValueType } from '@umbraco-cms/backoffice/models';
import type { UmbBlockGridLayoutModel } from '@umbraco-cms/backoffice/block-grid';

/**
 * Notice this utility method is not really shareable with others as it also takes areas into account. [NL]
 * @param args
 * @returns { null | true }
 */
function resolvePlacementAsGrid(args: resolvePlacementArgs<UmbBlockGridLayoutModel, UmbBlockGridEntryElement>) {
	// If this has areas, we do not want to move, unless we are at the edge
	if (args.relatedModel.areas?.length > 0 && isWithinRect(args.pointerX, args.pointerY, args.relatedRect, -10)) {
		return null;
	}

	/** We need some data about the grid to figure out if there is room to be placed next to the found element */
	const approvedContainerComputedStyles = getComputedStyle(args.containerElement);
	const gridColumnGap = Number(approvedContainerComputedStyles.columnGap.split('px')[0]) || 0;
	const gridColumnNumber = parseInt(
		approvedContainerComputedStyles.getPropertyValue('--umb-block-grid--grid-columns'),
		10,
	);

	const foundElColumns = parseInt(args.relatedElement.dataset.colSpan ?? '', 10);
	const currentElementColumns = args.item.columnSpan;

	if (currentElementColumns >= gridColumnNumber) {
		return true;
	}

	// Get grid template:
	const approvedContainerGridColumns = approvedContainerComputedStyles.gridTemplateColumns
		.trim()
		.split('px')
		.map((x) => Number(x))
		.filter((n) => n > 0)
		.map((n, i, list) => (list.length === i ? n : n + gridColumnGap));

	// ensure all columns are there.
	// This will also ensure handling non-css-grid mode,
	// use container width divided by amount of columns( or the item width divided by its amount of columnSpan)
	let amountOfColumnsInWeightMap = approvedContainerGridColumns.length;
	const amountOfUnknownColumns = gridColumnNumber - amountOfColumnsInWeightMap;
	if (amountOfUnknownColumns > 0) {
		const accumulatedValue = getAccumulatedValueOfIndex(amountOfColumnsInWeightMap, approvedContainerGridColumns) || 0;
		const missingColumnWidth = (args.containerRect.width - accumulatedValue) / amountOfUnknownColumns;
		if (missingColumnWidth > 0) {
			while (amountOfColumnsInWeightMap++ < gridColumnNumber) {
				approvedContainerGridColumns.push(missingColumnWidth);
			}
		}
	}

	let offsetPlacement = 0;
	/* If placeholder is in this same line, we want to assume that it will offset the placement of the found element,
	which provides more potential space for the item to drop at.
	This is relevant in this calculation where we look at the space to determine if its a vertical or horizontal drop in relation to the found element.
	*/
	if (args.placeholderIsInThisRow && args.elementRect.left < args.relatedRect.left) {
		offsetPlacement = -(args.elementRect.width + gridColumnGap);
	}

	const relatedStartX = Math.max(args.relatedRect.left - args.containerRect.left + offsetPlacement, 0);
	const relatedStartCol = Math.round(
		getInterpolatedIndexOfPositionInWeightMap(relatedStartX, approvedContainerGridColumns),
	);

	// If the found related element does not have enough room after which for the current element, then we go vertical mode:
	return relatedStartCol + (args.horizontalPlaceAfter ? foundElColumns : 0) + currentElementColumns > gridColumnNumber;
}

// --------------------------
// End of utils.
// --------------------------

const SORTER_CONFIG: UmbSorterConfig<UmbBlockGridLayoutModel, UmbBlockGridEntryElement> = {
	getUniqueOfElement: (element) => {
		return element.contentUdi!;
	},
	getUniqueOfModel: (modelEntry) => {
		return modelEntry.contentUdi;
	},
	resolvePlacement: resolvePlacementAsGrid,
	identifier: 'block-grid-editor',
	itemSelector: 'umb-block-grid-entry',
	containerSelector: '.umb-block-grid__layout-container',
};

/**
 * @element umb-block-grid-entries
 */
@customElement('umb-block-grid-entries')
export class UmbBlockGridEntriesElement extends UmbFormControlMixin(UmbLitElement) {
	//
	// TODO: Make sure Sorter callbacks handles columnSpan when retrieving a new entry.

	//
	#sorter = new UmbSorterController<UmbBlockGridLayoutModel, UmbBlockGridEntryElement>(this, {
		...SORTER_CONFIG,
		onStart: () => {
			this.#context.onDragStart();
		},
		onEnd: () => {
			this.#context.onDragEnd();
		},
		onChange: ({ model }) => {
			this.#context.setLayouts(model);
		},
		onRequestMove: ({ item }) => {
			return this.#context.allowDrop(item.contentUdi);
		},
		onDisallowed: () => {
			this.setAttribute('disallow-drop', '');
		},
		onAllowed: () => {
			this.removeAttribute('disallow-drop');
		},
	});

	#context = new UmbBlockGridEntriesContext(this);
	#controlValidator?: UmbFormControlValidator;

	@property({ attribute: false })
	public set areaKey(value: string | null | undefined) {
		this._areaKey = value;
		this.#context.setAreaKey(value ?? null);
		this.#controlValidator?.destroy();
		if (this.areaKey) {
			// Only when there is a area key we should create a validator, otherwise it is the root entries element, which is taking part of the Property Editor Form Control. [NL]
			// Currently there is no server validation for areas. So we can leave out the data path for it for now. [NL]
			this.#controlValidator = new UmbFormControlValidator(this, this);

			//new UmbBindServerValidationToFormControl(this, this, "$.values.[?(@.alias = 'my-input-alias')].value");
		}
	}
	public get areaKey(): string | null | undefined {
		return this._areaKey;
	}

	@property({ attribute: false })
	public set layoutColumns(value: number | undefined) {
		this.#context.setLayoutColumns(value);
	}
	public get layoutColumns(): number | undefined {
		return this.#context.getLayoutColumns();
	}

	@state()
	private _areaKey?: string | null;

	@state()
	private _canCreate?: boolean;

	@state()
	private _singleBlockTypeName?: string;

	@state()
	private _styleElement?: HTMLLinkElement;

	@state()
	private _layoutEntries: Array<UmbBlockGridLayoutModel> = [];

	constructor() {
		super();

		this.observe(
			this.#context.layoutEntries,
			(layoutEntries) => {
				//const oldValue = this._layoutEntries;
				this.#sorter.setModel(layoutEntries);
				this._layoutEntries = layoutEntries;
				//this.requestUpdate('layoutEntries', oldValue);
			},
			null,
		);

		this.observe(
			this.#context.amountOfAllowedBlockTypes,
			(length) => {
				this._canCreate = length > 0;
				if (length === 1) {
					this.observe(
						this.#context.firstAllowedBlockTypeName(),
						(firstAllowedName) => {
							this._singleBlockTypeName = firstAllowedName;
						},
						'observeSingleBlockTypeName',
					);
				} else {
					this.removeUmbControllerByAlias('observeSingleBlockTypeName');
				}
			},
			null,
		);

		this.observe(
			this.#context.rangeLimits,
			(rangeLimits) => {
				this.#setupRangeValidation(rangeLimits);
			},
			null,
		);

		this.#context.getManager().then((manager) => {
			this.observe(
				manager.layoutStylesheet,
				(stylesheet) => {
					if (!stylesheet || this._styleElement?.href === stylesheet) return;
					this._styleElement = document.createElement('link');
					this._styleElement.rel = 'stylesheet';
					this._styleElement.href = stylesheet;
				},
				'observeStylesheet',
			);
		});

		new UmbFormControlValidator(this, this /*, this.#dataPath*/);
	}

	#rangeUnderflowValidator?: UmbFormControlValidatorConfig;
	#rangeOverflowValidator?: UmbFormControlValidatorConfig;
	async #setupRangeValidation(rangeLimit: UmbNumberRangeValueType | undefined) {
		console.log('setupRangeValidation', rangeLimit);
		if (this.#rangeUnderflowValidator) {
			this.removeValidator(this.#rangeUnderflowValidator);
			this.#rangeUnderflowValidator = undefined;
		}
		if (rangeLimit?.min !== 0) {
			this.#rangeUnderflowValidator = this.addValidator(
				'rangeUnderflow',
				() => {
					return this.localize.term(
						'validation_entriesShort',
						rangeLimit!.min,
						(rangeLimit!.min ?? 0) - this._layoutEntries.length,
					);
				},
				() => {
					return this._layoutEntries.length < (rangeLimit?.min ?? 0);
				},
			);
		}

		if (this.#rangeOverflowValidator) {
			this.removeValidator(this.#rangeOverflowValidator);
			this.#rangeOverflowValidator = undefined;
		}
		if (rangeLimit?.max !== Infinity) {
			this.#rangeOverflowValidator = this.addValidator(
				'rangeOverflow',
				() => {
					return this.localize.term(
						'validation_entriesExceed',
						rangeLimit!.max,
						this._layoutEntries.length - (rangeLimit!.max ?? this._layoutEntries.length),
					);
				},
				() => {
					return (this._layoutEntries.length ?? 0) > (rangeLimit?.max ?? Infinity);
				},
			);
		}
	}

	// TODO: Missing ability to jump directly to creating a Block, when there is only one Block Type. [NL]
	override render() {
		return html`
			${this._styleElement}
			<div class="umb-block-grid__layout-container" data-area-length=${this._layoutEntries.length}>
				${repeat(
					this._layoutEntries,
					(x) => x.contentUdi,
					(layoutEntry, index) =>
						html`<umb-block-grid-entry
							class="umb-block-grid__layout-item"
							index=${index}
							.contentUdi=${layoutEntry.contentUdi}
							.layout=${layoutEntry}>
						</umb-block-grid-entry>`,
				)}
			</div>
			${this._areaKey ? html` <uui-form-validation-message .for=${this}></uui-form-validation-message>` : nothing}
			${this._canCreate ? this.#renderCreateButton() : nothing}
		`;
	}

	#renderCreateButton() {
		if (this._areaKey === null || this._layoutEntries.length === 0) {
			return html`<uui-button-group>
				<uui-button
					look="placeholder"
					label=${this._singleBlockTypeName
						? this.localize.term('blockEditor_addThis', [this._singleBlockTypeName])
						: this.localize.term('blockEditor_addBlock')}
					href=${this.#context.getPathForCreateBlock(-1) ?? ''}></uui-button>
				${this._areaKey === null
					? html` <uui-button
							label=${this.localize.term('content_createFromClipboard')}
							look="placeholder"
							href=${this.#context.getPathForClipboard(-1) ?? ''}>
							<uui-icon name="icon-paste-in"></uui-icon>
						</uui-button>`
					: nothing}
			</uui-button-group>`;
		} else {
			return html`
				<uui-button-inline-create
					href=${this.#context.getPathForCreateBlock(-1) ?? ''}
					label=${this.localize.term('blockEditor_addBlock')}></uui-button-inline-create>
			`;
		}
	}

	static override styles = [
		UmbTextStyles,
		css`
			:host {
				position: relative;
				display: grid;
				gap: 1px;
			}
			:host([disallow-drop])::before {
				content: '';
				position: absolute;
				z-index: 1;
				inset: 0;
				border: 2px solid var(--uui-color-danger);
				border-radius: calc(var(--uui-border-radius) * 2);
				pointer-events: none;
			}
			:host([disallow-drop])::after {
				content: '';
				position: absolute;
				z-index: 1;
				inset: 0;
				border-radius: calc(var(--uui-border-radius) * 2);
				background-color: var(--uui-color-danger);
				opacity: 0.2;
				pointer-events: none;
			}
			> div {
				display: flex;
				flex-direction: column;
				align-items: stretch;
			}

			uui-button-group {
				padding-top: 1px;
				grid-template-columns: 1fr auto;

				--umb-block-grid--is-dragging--variable: var(--umb-block-grid--is-dragging) none;
				display: var(--umb-block-grid--is-dragging--variable, grid);
			}

			.umb-block-grid__layout-container[data-area-length='0'] {
				--umb-block-grid--is-dragging--variable: var(--umb-block-grid--is-dragging) 1;
				min-height: calc(var(--umb-block-grid--is-dragging--variable, 0) * var(--uui-size-11));
				border: calc(var(--umb-block-grid--is-dragging--variable, 0) * 1px) dashed var(--uui-color-border);
				border-radius: var(--uui-border-radius);
			}
		`,
	];
}

export default UmbBlockGridEntriesElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-block-grid-entries': UmbBlockGridEntriesElement;
	}
}
