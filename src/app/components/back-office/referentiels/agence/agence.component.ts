import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReferentielBaseService } from 'src/app/services/referentiel/referentiel-base.service';
import { FormItem } from 'src/app/shared/components/form/form.component';
import { ActionClickEvent, ActionConfig, ColumnConfig, FilterField } from 'src/app/shared/components/table/table.config';
import { ITEMS_PER_PAGE } from 'src/app/shared/constants/shared.constant';
import {ToastService} from "../../../../shared/components/toast/toast.service";
import {TranslateService} from "@ngx-translate/core";
import { UpdateModalComponent } from '../update-modal/update-modal.component';
import { IAgentPayeur } from 'src/app/models/referentiel/agent-payeur';
import { ConfirmationModalComponent } from 'src/app/shared/components/confirmation-modal/confirmation-modal.component';
import { HttpHeaders, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-agence',
  templateUrl: './agence.component.html',
  styleUrl: './agence.component.scss'
})
export class AgenceComponent {
  totalItemsTitle: string = "villes";
  totalItems: number = 1;
  page: number = 1;
  itemsPerPage = ITEMS_PER_PAGE;
  predicate: string = '';
  ascending!: boolean;
  formFilter: FormGroup<any> | null | undefined;
  depotFormItems: FormItem[] = []
  constructor(private modalService: NgbModal, private referentielBaseService: ReferentielBaseService<IAgentPayeur>,
              private toastService: ToastService, private translateService: TranslateService) {
    this.referentielBaseService.setUrlEndpoint('Agence');
  }

  columns: ColumnConfig[] = [
    { field: 'code', header: 'referentiel.code', type: 'text', style: 'width: 20%;'},
    { field: 'libelle', header: 'referentiel.libelle', type: 'text'},
    { field: 'active', header: 'referentiel.active', type: 'badge', style: 'width: 15%'},

  ];
  actions: ActionConfig[] = [
    { label: 'modifier', action: 'modifier', icon: 'assets/images/icone/edit.svg' },
    { label: 'desactiver', action: 'desactivier', icon: 'assets/images/icone/desactiver.svg', fieldCondition: 'active', condition: true },
    { label: 'activer', action: 'activer', icon: 'assets/images/icone/activer.svg', fieldCondition: 'active', condition: false },
  ];
  updateButtonAction: () => void = () => this.openUpdateModal();
  filterFields: FilterField[] = [
    { name: 'code', placeholder: 'referentiel.code', type: 'text', style: 'min-width: 100px; width: 100px;' },
    { name: 'libelle', placeholder: 'referentiel.libelle', type: 'text' },
    { name: 'active', placeholder: 'referentiel.active', type: 'select', options:[{ value: 'true', label: 'activer'}, { value: 'false', label: 'Désactiver'}]},
  ];

  tableData: IAgentPayeur[] = []
  ngOnInit() {
    this.loadData();
  }

  loadData(page?: number, filters?: any): void {
    const pageSearch: number = page ?? this.page;
    const queryParams = {
      ...this.formFilter?.value,
      page: pageSearch - 1, 
      size: this.itemsPerPage 
    };
    this.referentielBaseService.getAll(queryParams).subscribe({
      next: (data: HttpResponse<IAgentPayeur[]>) => {
        if (data.body) {
          this.onSuccess(data.body, data.headers, pageSearch);
        }
      }
    });
  }

  protected onSuccess(res: IAgentPayeur[], headers: HttpHeaders, page: number): void {
    this.totalItems = Number(headers.get('X-Total-Count'));
    this.page = page;
    this.tableData = res ?? [];

    console.log("total item :",this.totalItems)
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData(page);
  }


  handelActions(event: ActionClickEvent<any>): void {
    if (event.action === 'desactiver' || event.action === 'activer') {
      const modalRef = this.modalService.open(ConfirmationModalComponent, { size: 'lg', backdrop: 'static' });
      const isActiver = event.action === 'activer'
      modalRef.componentInstance.title = !isActiver? 'referentiel.desactiverMessage' : 'referentiel.activerMessage';
      modalRef.componentInstance.value = event.item.libelle;
      modalRef.result.then((result) => {
        if(result){
          this.referentielBaseService.toggleActivate(event.item.id).subscribe({
            next: () => {
              const message = isActiver? 'global.messages.activerSuccess': 'global.messages.desactiverSuccess'
              this.toastService.showSuccess(this.translateService.instant(message));
              this.loadData()}
          });
        }

      }, () => {});
    }else if(event.action === 'modifier'){
      this.openUpdateModal(event.item,event.action);
    }else if (event.action === 'filter'){
      if (event.item && (
        event.item.code?.trim() !== '' || 
        event.item.libelle?.trim() !== '' || 
        event.item.active !== '' 
    )) {
        this.formFilter = new FormGroup({
            code: new FormControl(event.item.code),
            libelle: new FormControl(event.item.libelle),
            active: new FormControl(event.item.active),
        });
    } else {
        // Si tous les champs sont vides ou null
        this.formFilter = null;
    }

    this.loadData();
}else if (event.action === 'reset-filter'){
      this.formFilter = event.item;
      this.loadData();
    }
  }
  openUpdateModal(item?:IAgentPayeur,action?:string) {
    const modalRef = this.modalService.open(UpdateModalComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.formItems = this.setFormItemValues(item);
    modalRef.componentInstance.action = action;
    if(action==='modifier'){
      modalRef.componentInstance.title="MODIFIER UNE VALEUR"
    }else{
      modalRef.componentInstance.title="AJOUTER UNE NOUVELLE VALEUR"
    }

    modalRef.result.then((form) => {
      const agentPayer: IAgentPayeur = form.value;
      agentPayer.id = item?.id;
      agentPayer.active = item?.active;
      this.referentielBaseService.createOrUpdate(agentPayer)
        .subscribe({
          next: (res) => {
            if (action === 'modifier') {
              this.toastService.showSuccess(this.translateService.instant('global.messages.updateSuccess'));
            } else {
              this.toastService.showSuccess(this.translateService.instant('global.messages.addSuccess'));
            }
            this.loadData();
          },
          error: (error) => {
            let errorMessage=error.error.message; 
            if(errorMessage==='global.messages.codeAlreadyExisteVerification'){
              this.toastService.showError(this.translateService.instant('errorMessage')); 
            }
          }
        });
    })
  }
  setFormItemValues(item?:IAgentPayeur):FormItem[]{
    if(item){
      this.depotFormItems = [
        {
          itemType: 'field',
          placeholder: 'referentiel',
          type: 'text',
          value: "Agence",
          disabled: true,
        },
        {
          itemType: 'field',
          placeholder: 'code',
          type: 'text',
          value: item.code,
          disabled: false,
          validators: [Validators.required]
        },
        {
          itemType: 'field',
          placeholder: 'libelle',
          type: 'text',
          value: item.libelle,
          disabled: false,
          validators: [Validators.required]
        },
      ]
    }else {
      this.depotFormItems = [
        {
          itemType: 'field',
          placeholder: 'referentiel',
          type: 'text',
          value: "Agence",
          disabled: true,
        },
        {
          itemType: 'field',
          placeholder: 'code',
          type: 'text',
          value: null,
          disabled: false,
          validators: [Validators.required]
        },
        {
          itemType: 'field',
          placeholder: 'libelle',
          type: 'text',
          value: null,
          disabled: false,
          validators: [Validators.required]
        }
      ]
    }
    return this.depotFormItems;
  }
}
