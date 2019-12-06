/* eslint-disable prefer-object-spread */
/* eslint-disable prettier/prettier */
const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utilities/apiFeatures');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');




const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([{
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'imageCover',
    maxCount: 3
  },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();
  req.body.imageCover = `tours-${req.params.id}-${Date.now()}-cover.jpeg`
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({
      quality: 90
    })
    .toFile(`public/img/tours/${ req.body.imageCover}`);

  req.body.images = [];
  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;

    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({
        quality: 90
      })
      .toFile(`public/img/tours/${ filename}`);
    req.body.images.push(filename);
  }));

  next();
});

exports.cheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAlltours = catchAsync(async (req, res) => {
  // execute query
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // const tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');
  res.status(200).json({
    restime: req.requestTime,
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTours = factory.getOne(Tour, {
  path: 'reviews'
});

// exports.getTours = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate('reviews');
//   if (!tour) {
//     return next(new AppError('No tour founded with that ID', 404));
//   }
//   // findOne({_id:req.params.id})
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });

// exports.newTours = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
// });

exports.newTours = factory.createOne(Tour);
// exports.updateTours = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!tour) {
//     return next(new AppError('No tour founded with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// });
exports.updateTours = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError('No tour founded with that ID', 404));
//   }
//   res.status(200).json({
//     status: 'Successfully deleted'
//   });
// });
exports.deleteTour = factory.deleteOne(Tour);
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([{
        $match: {
          ratingsAverage: {
            $gte: 4.5
          }
        }
      },

      {
        $group: {
          _id: '$difficulty',
          numTours: {
            $sum: 1
          },
          avgRating: {
            $avg: '$ratingsAverage'
          },
          avgPrice: {
            $avg: '$price'
          },
          minPrice: {
            $min: '$price'
          },
          maxPrice: {
            $max: '$price'
          }
        }
      }
    ]);
    res.status(200).json({
      data: {
        stats
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([{
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            $month: '$startDates'
          },
          numTourStarts: {
            $sum: 1
          },
          name: {
            $push: '$name'
          }
        }
      },
      {
        $addFields: {
          month: '$_id'
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err
    });
  }
};

// tours-within/:distance/center/:latlng/unit/:unit
// tours-within/233/center/34.111175/unit/mt

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const {
    distance,
    latlng,
    unit
  } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    return next(new AppError('Please provide latilng in the format lat,lang.', 400));
  }
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [
          [lng, lat],
          radius
        ]
      }
    }
  });


  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const {
    latlng,
    unit
  } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(new AppError('Please provide latilng in the format lat,lang.', 400));
  }
  const distances = await Tour.aggregate([{
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });




});