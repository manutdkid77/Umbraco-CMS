import type { DemoModalData, DemoModalResult } from './example-modal-token.js';
import { css, html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import type { UmbModalContext } from '@umbraco-cms/backoffice/modal';
import './example-custom-modal-element.element.js';

@customElement('example-modal-view')
export class UmbExampleModalViewElement extends UmbLitElement {

    @property({ attribute: false })
	public modalContext?: UmbModalContext<DemoModalData, DemoModalResult>;

    onClickDone(){
        this.modalContext?.submit();
	}

	render() {
		return html`
			<div id="modal">
                <p>Example content of custom modal element</p>
                <uui-button look="primary" label="Submit modal" @click=${() => this.onClickDone()}></uui-button>
            </div>
		`;
	}

    static styles = [
		css`
			:host {
				background: #eaeaea;
    			display: block;
				box-sizing:border-box;
			}

			#modal {
				box-sizing:border-box;
			}

			p {
				margin:0;
				padding:0;
			}
 
		`,
	];
}

export default UmbPocModalViewElement

declare global {
    interface HTMLElementTagNameMap {
        'example-modal-view': UmbExampleModalViewElement;
    }
}