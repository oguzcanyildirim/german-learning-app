import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LessonDetailPage } from './lesson-detail.page';
import { LessonDetailPageRoutingModule } from './lesson-detail-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    LessonDetailPageRoutingModule
  ],
  declarations: [LessonDetailPage]
})
export class LessonDetailPageModule {}
