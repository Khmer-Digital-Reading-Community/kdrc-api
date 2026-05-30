import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ExchangesService } from './exchanges.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Controller('exchanges')
export class ExchangesController {
  constructor(
    private readonly exchangesService: ExchangesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createExchangeDto: CreateExchangeDto,
  ) {
    // If a file was uploaded, send it to Cloudinary and attach the URL
    if (file) {
      const result = await this.cloudinaryService.uploadBookCover(file);
      if (result && result.secure_url) {
        // assign uploaded image URL to the DTO so service can persist it
        (createExchangeDto as any).imageUrl = result.secure_url;
      }
    }

    return this.exchangesService.create(createExchangeDto);
  }

  @Get()
  findAll(
    @Query() query: { search?: string; condition?: string; location?: string },
  ) {
    return this.exchangesService.searchExchanges(query);
  }
  // fetch a single book by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exchangesService.findOne(id);
  }

  // update a book my id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateExchangeDto: UpdateExchangeDto,
  ) {
    return this.exchangesService.update(id, updateExchangeDto);
  }

  // delete a book by id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exchangesService.remove(id);
  }
}
