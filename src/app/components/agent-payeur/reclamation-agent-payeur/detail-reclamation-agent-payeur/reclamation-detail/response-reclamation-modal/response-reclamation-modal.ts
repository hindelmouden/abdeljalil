import { Component } from '@angular/core';
import { NgbActiveModal, NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { TranslateService } from "@ngx-translate/core";
import {Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ToastService} from "../../../../../../shared/components/toast/toast.service";
import {StatusDossier} from "../../../../../../enums/status-dossier";
import {IReclamation} from "../../../../../../models/reclamation";
import {StatusReclamation} from "../../../../../../enums/status-reclamation";

@Component({
  selector: 'app-declare-reclamation-modal',
  templateUrl: './response-reclamation-modal.html',
  styleUrls: ['./response-reclamation-modal.scss']
})
export class ResponseReclamationModal {
  selectedNatureReclamation: string = '';
  message?: string ;
  dateSurvenance?: NgbDateStruct ;
  reclamationForm :FormGroup;
  attachedFile: File | null = null;
  formSubmitted: boolean = false;


  minDate: NgbDateStruct = { year: 2022, month: 1, day: 1 };
  maxDate: NgbDateStruct = { year: 2023, month: 12, day: 31 };
  startAt: NgbDateStruct = { year: 2022, month: 1, day: 1 };

  constructor(public activeModal: NgbActiveModal, private translateService: TranslateService,
              private router: Router, private formBuilder: FormBuilder, private toastService : ToastService) {
    this.reclamationForm = this.formBuilder.group(
      {
        message: ['', Validators.required],
        pieceJointe: [''],
      }
    )
  }

  close() {
    this.activeModal.close();
  }
  isInvalid(controlName: string): boolean {
    const control = this.reclamationForm.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched || this.formSubmitted) : false;
  }


  declare() {
    this.saveData(StatusReclamation.REPONDUE);
  }

  handleFile(event: any) {
    if (event && event.target && event.target.files && event.target.files.length > 0) {
      this.attachedFile = event.target.files[0];
    }
  }

  onDateChange(event: NgbDateStruct) {
    this.dateSurvenance = event;
  }

  saveData(status: string) {
    this.formSubmitted = true;

    Object.keys(this.reclamationForm.controls).forEach(key => {
      const control = this.reclamationForm.get(key);
      if (control?.status == "INVALID")
      {
        this.toastService.showError("Le champ " + key + " est obligatoire !" );
      }
      });

    if (this.reclamationForm.valid) {
      const responseReclamation: IReclamation = {
        createdAt: new Date().toString(),
        pieceJointe: this.reclamationForm.get('pieceJointe')!.value,
        status: status,
        message: this.reclamationForm.get('message')!.value
      };
      localStorage.setItem('responseReclamation', JSON.stringify(responseReclamation));
      this.activeModal.close(status);
    }
  }
}
