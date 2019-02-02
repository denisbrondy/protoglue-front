import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogConfig, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface Factor {
  value: number;
  viewValue: string;
}

export interface Speed {
  value: number;
  viewValue: string;
}

@Component({
  selector: 'control-dialog',
  templateUrl: './control.dialog.html'
})
export class DialogConfirm {

  constructor(
    public dialogRef: MatDialogRef<DialogConfirm>) { }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

@Component({
  selector: 'app-control',
  templateUrl: './control.component.html',
  styleUrls: ['./control.component.css']
})
export class ControlComponent implements OnInit {

  public bleDevice: BluetoothDevice = null;

  public bleServer: BluetoothRemoteGATTServer = null;

  public commandCharacteristic: BluetoothRemoteGATTCharacteristic = null;

  public connected: boolean = false;

  public deviceName: String = '';

  public motorPosition: number = 0;

  public stepFactor: number = 1;

  public userDefinedStepValue: number = 0;

  public moving: boolean = false;

  public factors: Factor[] = [
    { value: 1, viewValue: 'Step by step' },
    { value: 10, viewValue: '10 steps' },
    { value: 360, viewValue: '1 revolution' },
    { value: 3600, viewValue: '10 revolutions' },
    { value: -1, viewValue: 'User defined' },
  ];

  public speeds: Speed[] = [
    { value: 1, viewValue: 'Low' },
    { value: 1, viewValue: 'Medium' },
    { value: 1, viewValue: 'High' },
  ];

  public speed: number = 1;

  constructor(public confirmDialog: MatDialog) { }

  public scan() {
    var that = this;
    (window.navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['39ead0db-0bbf-449a-9af9-24001ea09aa3']
    }).then(function (device: BluetoothDevice) {
      that.bleDevice = device;
      that.bleDevice.addEventListener('gattserverdisconnected', function (event) {
        that.disconnect();
      });
      device.gatt.connect().then(function (server: BluetoothRemoteGATTServer) {
        server.getPrimaryService('39ead0db-0bbf-449a-9af9-24001ea09aa3').then(function (service: BluetoothRemoteGATTService) {
          that.deviceName = device.name;
          that.connected = true;
          service.getCharacteristic('38149ecc-adb2-4ff3-89d5-6083d52c5e9f').then(function (characteristic: BluetoothRemoteGATTCharacteristic) {
            return characteristic.startNotifications();
          })
            .then(function (characteristic) {
              characteristic.addEventListener('characteristicvaluechanged',
                function (event) {
                  let charac: BluetoothRemoteGATTCharacteristic = <BluetoothRemoteGATTCharacteristic>event.target;
                  that.motorPosition = charac.value.getInt32(0, true);
                  that.moving = Boolean(charac.value.getInt8(4));
                });
            }).catch(function (error) {
              console.log(error);
            });
          service.getCharacteristic('8a21ad2c-279d-41d1-94bf-6916ecbb3695').then(function (characteristic: BluetoothRemoteGATTCharacteristic) {
            that.commandCharacteristic = characteristic;
          }).catch(function (error) {
            console.log(error);
          });
        }).catch(function (error) {
          console.log(error);
        });
      }).catch(function (error) {
        console.log(error);
      });
    }).catch(function (error) {
      console.log(error);
    });
  }

  public forward() {
    var buffer = new ArrayBuffer(3);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 1);
    if (this.stepFactor == -1 && this.userDefinedStepValue !== undefined) {
      dataView.setInt16(1, this.userDefinedStepValue);
    } else {
      dataView.setInt16(1, this.stepFactor);
    }
    this.commandCharacteristic.writeValue(dataView);
  }

  public backward() {
    var buffer = new ArrayBuffer(3);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 2);
    if (this.stepFactor == -1 && this.userDefinedStepValue !== undefined) {
      dataView.setInt16(1, this.userDefinedStepValue);
    } else {
      dataView.setInt16(1, this.stepFactor);
    }
    this.commandCharacteristic.writeValue(dataView);
  }

  public stop() {
    var buffer = new ArrayBuffer(1);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 3);
    this.commandCharacteristic.writeValue(dataView);
  }

  public goToZero() {
    var buffer = new ArrayBuffer(1);
    var dataView = new DataView(buffer);
    dataView.setInt8(0, 4);
    this.commandCharacteristic.writeValue(dataView);
  }

  public resetZeroPosition() {
    const dialogRef = this.confirmDialog.open(DialogConfirm);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        var buffer = new ArrayBuffer(1);
        var dataView = new DataView(buffer);
        dataView.setInt8(0, 5);
        this.commandCharacteristic.writeValue(dataView);
      }
    });
  }

  public disconnect() {
    if (this.bleDevice.gatt.connected) {
      this.bleDevice.gatt.disconnect();
    }
    this.connected = false;
    this.deviceName = '';
    this.motorPosition = 0;
  }

  ngOnInit() {

  }

}

