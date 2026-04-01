import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface QuantityDTO {
  value: number;
  unit: string;
  measurementType: string;
}

export interface QuantityInputDTO {
  thisQuantityDTO: QuantityDTO;
  thatQuantityDTO: QuantityDTO;
}

export interface QuantityMeasurementDTO {
  result?: number;
  value?: number;
}

@Injectable({ providedIn: 'root' })
export class QuantityService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  add(data: QuantityInputDTO) {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/add`, data);
  }

  subtract(data: QuantityInputDTO) {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/subtract`, data);
  }

  divide(data: QuantityInputDTO) {
    return this.http.post<number>(`${this.base}/divide`, data);
  }

  convert(data: QuantityInputDTO) {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/convert`, data);
  }

  compare(data: QuantityInputDTO) {
    return this.http.post<QuantityMeasurementDTO>(`${this.base}/compare`, data);
  }
}