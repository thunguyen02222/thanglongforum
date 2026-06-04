import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faculty, FacultySchema, Major, MajorSchema, Class, ClassSchema } from './schemas';
import { FacultyService } from './services/faculty.service';
import {
  AdminFacultyController,
  AdminMajorController,
  AdminClassController,
  FacultyController,
  MajorController
} from './controllers/faculty.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Faculty.name, schema: FacultySchema },
      { name: Major.name, schema: MajorSchema },
      { name: Class.name, schema: ClassSchema }
    ]),
    forwardRef(() => AuthModule)
  ],
  controllers: [
    AdminFacultyController,
    AdminMajorController,
    AdminClassController,
    FacultyController,
    MajorController
  ],
  providers: [FacultyService],
  exports: [FacultyService]
})
export class FacultyModule {}
