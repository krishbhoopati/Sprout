-- Sprout seed data (generated from backend/app/data/crop_seed_data.json)
-- Reference crops + companion/conflict relationships (IMPLEMENTATION.md §9).

insert into public.crops (id,name,spacing_cm,days_to_maturity,harvest_duration_days,sunlight_requirement,height_cm,minimum_yield_kg,maximum_yield_kg,estimated_price_per_kg,planting_month_start,planting_month_end,difficulty) values
('lettuce','Lettuce',20,45,21,'partial_sun',25,0.3,0.5,6.5,3,5,'easy'),
('bush_beans','Bush Beans',15,55,30,'full_sun',50,0.3,0.6,7.0,5,7,'easy'),
('tomato','Tomato',60,75,60,'full_sun',150,3.0,6.0,5.5,4,6,'medium'),
('carrot','Carrot',8,70,21,'full_sun',30,0.08,0.15,3.5,3,7,'easy'),
('kale','Kale',40,55,60,'partial_sun',60,0.5,1.0,6.0,3,8,'easy'),
('peas','Snap Peas',10,60,21,'full_sun',120,0.15,0.3,8.0,3,4,'easy'),
('basil','Basil',25,50,60,'full_sun',45,0.1,0.25,25.0,5,6,'easy'),
('radish','Radish',5,28,14,'partial_sun',20,0.02,0.04,4.5,3,9,'easy'),
('spinach','Spinach',15,40,21,'partial_sun',25,0.15,0.3,7.5,3,9,'easy'),
('bell_pepper','Bell Pepper',45,70,60,'full_sun',75,1.0,2.5,6.5,5,6,'medium'),
('cucumber','Cucumber',45,55,45,'full_sun',200,2.0,4.0,4.0,5,6,'medium'),
('zucchini','Zucchini',60,50,60,'full_sun',80,3.0,6.0,4.0,5,6,'easy'),
('beet','Beet',10,55,21,'full_sun',30,0.1,0.2,4.0,3,8,'easy'),
('broccoli','Broccoli',45,65,21,'full_sun',60,0.3,0.6,5.0,3,8,'medium'),
('swiss_chard','Swiss Chard',30,50,90,'partial_sun',50,0.4,0.8,6.0,3,8,'easy'),
('onion','Onion',10,100,14,'full_sun',40,0.1,0.2,3.0,3,4,'medium'),
('arugula','Arugula',12,30,21,'partial_sun',20,0.08,0.15,12.0,3,9,'easy'),
('cherry_tomato','Cherry Tomato',50,65,70,'full_sun',140,2.0,4.0,8.0,4,6,'medium'),
('watermelon','Watermelon',180,85,21,'full_sun',40,4.0,9.0,2.5,5,6,'hard'),
('cilantro','Cilantro',15,45,21,'partial_sun',40,0.05,0.12,20.0,3,9,'easy')
on conflict (id) do nothing;

insert into public.crop_relationships (crop_id,related_crop_id,relationship_type,score) values
('tomato','basil','companion',3),
('tomato','carrot','companion',2),
('tomato','onion','companion',2),
('cherry_tomato','basil','companion',3),
('carrot','peas','companion',2),
('carrot','lettuce','companion',2),
('carrot','radish','companion',2),
('lettuce','radish','companion',2),
('cucumber','bush_beans','companion',2),
('cucumber','radish','companion',2),
('broccoli','beet','companion',2),
('kale','beet','companion',2),
('bush_beans','beet','conflict',2),
('onion','peas','conflict',3),
('onion','bush_beans','conflict',3),
('tomato','broccoli','conflict',2),
('cucumber','basil','conflict',1);
