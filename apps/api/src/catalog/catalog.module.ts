import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { ProgramsController } from './programs/programs.controller';
import { CoursesController } from './courses/courses.controller';
import { SubjectsController } from './subjects/subjects.controller';
import { TopicsController } from './topics/topics.controller';
import { SkillsController } from './skills/skills.controller';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CatalogService],
  controllers: [
    ProgramsController,
    CoursesController,
    SubjectsController,
    TopicsController,
    SkillsController,
  ],
})
export class CatalogModule {}
