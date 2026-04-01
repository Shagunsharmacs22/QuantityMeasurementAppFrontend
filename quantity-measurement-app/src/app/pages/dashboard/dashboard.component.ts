import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { QuantityService, QuantityInputDTO } from '../../core/services/quantity.service';

interface HistoryItem {
  operation: string;
  measurementType: string;
  result: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // UI state
  historyOpen = false;
  resultText = 'Result will appear here';

  // Unit map
  unitMap: Record<string, string[]> = {
    LENGTH:      ['INCHES', 'FEET', 'YARDS', 'CENTIMETERS'],
    TEMPERATURE: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
    VOLUME:      ['MILLILITRE', 'LITRE', 'GALLON'],
    WEIGHT:      ['GRAM', 'KILOGRAM', 'POUND']
  };

  measurementTypes = ['LENGTH', 'TEMPERATURE', 'VOLUME', 'WEIGHT'];
  operations: string[] = [];
  units: string[] = [];

  // Form fields
  selectedType = 'LENGTH';
  selectedOperation = '';
  v1 = 0;
  v2 = 0;
  u1 = '';
  u2 = '';

  history: HistoryItem[] = [];

  constructor(
    private authService: AuthService,
    private quantityService: QuantityService
  ) {}

  ngOnInit() {
    this.updateUnits();
    const saved = localStorage.getItem('localHistory');
    if (saved) this.history = JSON.parse(saved);
  }

  updateUnits() {
    this.units = this.unitMap[this.selectedType];
    this.u1 = this.units[0];
    this.u2 = this.units[0];
    this.updateOperations();
  }

  updateOperations() {
    if (this.selectedType === 'TEMPERATURE') {
      this.operations = ['compare', 'convert'];
    } else {
      this.operations = ['add', 'subtract', 'divide', 'compare', 'convert'];
    }
    this.selectedOperation = this.operations[0];
  }

  get showV2(): boolean {
    return this.selectedOperation !== 'convert';
  }

  toggleHistory() {
    this.historyOpen = !this.historyOpen;
  }

  logout() {
    this.authService.logout();
  }

  private buildPayload(): QuantityInputDTO {
    const base = { measurementType: this.selectedType };
    if (this.selectedOperation === 'convert') {
      return {
        thisQuantityDTO: { value: this.v1, unit: this.u1, ...base },
        thatQuantityDTO: { value: this.v1, unit: this.u2, ...base }
      };
    }
    return {
      thisQuantityDTO: { value: this.v1, unit: this.u1, ...base },
      thatQuantityDTO: { value: this.v2, unit: this.u2, ...base }
    };
  }

  private temperatureConvert(): number {
    const v = this.v1;
    const from = this.u1, to = this.u2;
    if (from === to) return v;
    if (from === 'CELSIUS'    && to === 'FAHRENHEIT') return (v * 9 / 5) + 32;
    if (from === 'CELSIUS'    && to === 'KELVIN')     return v + 273.15;
    if (from === 'FAHRENHEIT' && to === 'CELSIUS')    return (v - 32) * 5 / 9;
    if (from === 'FAHRENHEIT' && to === 'KELVIN')     return (v - 32) * 5 / 9 + 273.15;
    if (from === 'KELVIN'     && to === 'CELSIUS')    return v - 273.15;
    if (from === 'KELVIN'     && to === 'FAHRENHEIT') return (v - 273.15) * 9 / 5 + 32;
    return v;
  }

  private addHistory(op: string, type: string, result: string) {
    this.history.push({ operation: op, measurementType: type, result });
    localStorage.setItem('localHistory', JSON.stringify(this.history));
  }

  calculate() {
    const op   = this.selectedOperation;
    const type = this.selectedType;

    // Temperature convert → handled on frontend
    if (type === 'TEMPERATURE' && op === 'convert') {
      const res = this.temperatureConvert();
      this.resultText = `${res.toFixed(2)} ${this.u2}`;
      this.addHistory(op, type, this.resultText);
      return;
    }

    const data = this.buildPayload();

    // ✅ FIX: Explicit Observable<any> type to avoid subscribe error
    let call$: Observable<any>;

    if (op === 'add')           call$ = this.quantityService.add(data);
    else if (op === 'subtract') call$ = this.quantityService.subtract(data);
    else if (op === 'divide')   call$ = this.quantityService.divide(data);
    else if (op === 'convert')  call$ = this.quantityService.convert(data);
    else                        call$ = this.quantityService.compare(data);

    call$.subscribe({
      next: (apiResult: any) => {
        let display = '';
        if (op === 'compare') {
          display = apiResult.result === 1 ? 'Equal ✅' : 'Not Equal ❌';
        } else if (op === 'divide') {
          display = String(apiResult);
        } else {
          const val = apiResult.result ?? apiResult.value ?? '';
          display = `${val} ${this.u2}`;
        }
        this.resultText = display;
        this.addHistory(op, type, display);
      },
      error: () => {
        this.resultText = 'Error! Check token or input';
      }
    });
  }

  get recentHistory(): HistoryItem[] {
    return this.history.slice(-10).reverse();
  }
}