-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: inventario_reactivos
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '7e5141a9-0dec-11f1-bf00-bc0ff371e33f:1-33';

--
-- Table structure for table `clasificaciones`
--

DROP TABLE IF EXISTS `clasificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clasificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código corto para identificación rápida (ej: ACD, BAS, OXI)',
  `color_hex` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Color hexadecimal para identificación visual',
  `nivel_peligro` enum('bajo','medio','alto','muy_alto') COLLATE utf8mb4_unicode_ci DEFAULT 'bajo',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `icono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del icono a usar en la interfaz',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clasificaciones`
--

LOCK TABLES `clasificaciones` WRITE;
/*!40000 ALTER TABLE `clasificaciones` DISABLE KEYS */;
INSERT INTO `clasificaciones` VALUES (1,'Ácido','ACD','#FF4444','alto','Sustancias que liberan iones H+ en solución acuosa','flask-round-poison','2026-02-19 23:48:36','2026-02-19 23:48:36'),(2,'Base','BAS','#4444FF','alto','Sustancias que liberan iones OH- en solución acuosa','flask-round','2026-02-19 23:48:36','2026-02-19 23:48:36'),(3,'Oxidante','OXI','#FF8C00','muy_alto','Sustancias que facilitan la oxidación de otros compuestos','fire','2026-02-19 23:48:36','2026-02-19 23:48:36'),(4,'Reductor','RED','#9370DB','medio','Sustancias que facilitan la reducción de otros compuestos','atom','2026-02-19 23:48:36','2026-02-19 23:48:36'),(5,'Disolvente','DIS','#00CED1','medio','Sustancias que disuelven otras sustancias','droplet','2026-02-19 23:48:36','2026-02-19 23:48:36'),(6,'Indicador','IND','#FFD700','bajo','Sustancias que cambian de color según el pH u otras condiciones','eye','2026-02-19 23:48:36','2026-02-19 23:48:36'),(7,'Catalizador','CAT','#32CD32','medio','Sustancias que aceleran reacciones químicas sin consumirse','rocket','2026-02-19 23:48:36','2026-02-19 23:48:36'),(8,'Tóxico','TOX','#8B0000','muy_alto','Sustancias nocivas para la salud humana','skull','2026-02-19 23:48:36','2026-02-19 23:48:36'),(9,'Inflamable','INF','#FF4500','muy_alto','Sustancias que se encienden fácilmente','flame','2026-02-19 23:48:36','2026-02-19 23:48:36'),(10,'Corrosivo','COR','#DC143C','muy_alto','Sustancias que destruyen tejidos vivos y materiales','flask-round-poison','2026-02-19 23:48:36','2026-02-19 23:48:36'),(11,'Explosivo','EXP','#B22222','muy_alto','Sustancias que pueden detonar o explotar','bomb','2026-02-19 23:48:36','2026-02-19 23:48:36'),(12,'Irritante','IRR','#FFA500','medio','Sustancias que causan irritación en piel o mucosas','alert-circle','2026-02-19 23:48:36','2026-02-19 23:48:36'),(13,'Grado Técnico','TEC','#808080','bajo','Pureza estándar para uso general','tag','2026-02-19 23:48:36','2026-02-19 23:48:36'),(14,'Grado Analítico','ANA','#4169E1','bajo','Alta pureza para análisis químico','microscope','2026-02-19 23:48:36','2026-02-19 23:48:36'),(15,'Grado HPLC','HPLC','#0000CD','bajo','Pureza para cromatografía líquida de alta resolución','test-tube','2026-02-19 23:48:36','2026-02-19 23:48:36'),(16,'Grado Reactivo','REA','#6495ED','bajo','Pureza para síntesis química','flask-conical','2026-02-19 23:48:36','2026-02-19 23:48:36'),(17,'Bioquímico','BIO','#228B22','bajo','Reactivos para aplicaciones biológicas','dna','2026-02-19 23:48:36','2026-02-19 23:48:36'),(18,'Síntesis','SIN','#4B0082','medio','Reactivos para síntesis química','flask-conical','2026-02-19 23:48:36','2026-02-19 23:48:36'),(19,'Sal','SAL','#87CEEB','bajo','Compuestos iónicos','salt','2026-02-19 23:48:36','2026-02-19 23:48:36'),(20,'Solvente Orgánico','SOL','#20B2AA','medio','Disolventes basados en carbono','droplet','2026-02-19 23:48:36','2026-02-19 23:48:36'),(21,'Buffer','BUF','#3CB371','bajo','Soluciones reguladoras de pH','beaker','2026-02-19 23:48:36','2026-02-19 23:48:36'),(22,'Estándar','EST','#DAA520','bajo','Sustancias de referencia para calibración','target','2026-02-19 23:48:36','2026-02-19 23:48:36');
/*!40000 ALTER TABLE `clasificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_movimientos`
--

DROP TABLE IF EXISTS `historial_movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reactivo_id` int NOT NULL,
  `tipo_movimiento` enum('entrada','salida','ajuste','caducidad') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `cantidad_anterior` decimal(10,2) NOT NULL COMMENT 'Cantidad antes del movimiento',
  `cantidad_posterior` decimal(10,2) NOT NULL COMMENT 'Cantidad después del movimiento',
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Razón del movimiento',
  `responsable` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Persona responsable del movimiento',
  `documento_referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Número de documento de respaldo',
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_movimiento` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reactivo` (`reactivo_id`),
  KEY `idx_fecha` (`fecha_movimiento`),
  KEY `idx_tipo` (`tipo_movimiento`),
  CONSTRAINT `historial_movimientos_ibfk_1` FOREIGN KEY (`reactivo_id`) REFERENCES `reactivos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_movimientos`
--

LOCK TABLES `historial_movimientos` WRITE;
/*!40000 ALTER TABLE `historial_movimientos` DISABLE KEYS */;
INSERT INTO `historial_movimientos` VALUES (1,1,'entrada',500.00,0.00,500.00,'Compra inicial de inventario','Admin','FAC-001','Ingreso inicial al sistema','2026-02-20 03:14:41');
/*!40000 ALTER TABLE `historial_movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_request_materials`
--

DROP TABLE IF EXISTS `loan_request_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_request_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_request_id` int NOT NULL,
  `cantidad` int NOT NULL,
  `unidad` varchar(100) NOT NULL,
  `material_name` varchar(255) NOT NULL,
  `observaciones` text,
  PRIMARY KEY (`id`),
  KEY `loan_request_id` (`loan_request_id`),
  CONSTRAINT `loan_request_materials_ibfk_1` FOREIGN KEY (`loan_request_id`) REFERENCES `loan_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_request_materials`
--

LOCK TABLES `loan_request_materials` WRITE;
/*!40000 ALTER TABLE `loan_request_materials` DISABLE KEYS */;
INSERT INTO `loan_request_materials` VALUES (1,1,4,'Frascos','Ácido Clorhídrico','Uso para titulación ácido-base'),(2,5,1,'pza','Tubos de ensayo',NULL),(3,5,1,'pza','Matraz',NULL);
/*!40000 ALTER TABLE `loan_request_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_requests`
--

DROP TABLE IF EXISTS `loan_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `practice_name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `schedule` varchar(100) NOT NULL,
  `practice_date` date NOT NULL,
  `request_date` date DEFAULT (curdate()),
  `request_time` time DEFAULT (curtime()),
  `laboratory` varchar(100) DEFAULT 'Laboratorio de Nanotecnología',
  `area` varchar(50) DEFAULT 'Área 4',
  `status` enum('pendiente','aprobado','rechazado') DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `loan_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_requests`
--

LOCK TABLES `loan_requests` WRITE;
/*!40000 ALTER TABLE `loan_requests` DISABLE KEYS */;
INSERT INTO `loan_requests` VALUES (1,4,'Práctica de Ácidos y Bases','Química General','3A','Lunes 10:00-12:00','2026-02-26','2026-02-19','21:15:37','Laboratorio de Nanotecnología','Área 4','rechazado','2026-02-20 03:15:37'),(2,6,'Determinación del Ph','Química orgánica','LINT001','13:00-15:00','2026-02-23','2026-02-19','21:25:32','Laboratorio de Nanotecnología','Área 4','aprobado','2026-02-20 03:25:32'),(3,6,'Práctica de Ácidos y Bases','Química Básica','LINT001','11:00 - 13:00','2026-02-27','2026-02-19','21:30:18','Laboratorio de Nanotecnología','Área 4','aprobado','2026-02-20 03:30:18'),(4,6,'Solidificación','Química Básica','LINT006','09:00-11:00','2026-02-27','2026-02-19','21:35:29','Laboratorio de Nanotecnología','Área 4','aprobado','2026-02-20 03:35:29'),(5,6,'Solidificación','Química','LINT002','11:00-13:00','2026-02-27','2026-02-19','21:52:12','Laboratorio de Nanotecnología','Área 4','pendiente','2026-02-20 03:52:12');
/*!40000 ALTER TABLE `loan_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reactivos`
--

DROP TABLE IF EXISTS `reactivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reactivos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nombre del reactivo químico',
  `formula_quimica` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Fórmula química del reactivo (ej: H2SO4, NaCl)',
  `clasificacion_id` int NOT NULL COMMENT 'FK a clasificaciones',
  `cas_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Número CAS (Chemical Abstracts Service)',
  `presentacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Presentación del reactivo (ej: polvo, líquido, solución)',
  `cantidad_actual` decimal(10,2) DEFAULT '0.00' COMMENT 'Cantidad disponible en inventario',
  `unidad_medida` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'ml' COMMENT 'Unidad de medida (ml, g, kg, L)',
  `cantidad_minima` decimal(10,2) DEFAULT '0.00' COMMENT 'Cantidad mínima para alerta de reabastecimiento',
  `ubicacion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ubicación física en el laboratorio',
  `numero_frascos` int DEFAULT '1' COMMENT 'Número de contenedores/frascos',
  `lote` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Número de lote del fabricante',
  `fecha_caducidad` date DEFAULT NULL COMMENT 'Fecha de caducidad del reactivo',
  `fabricante` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nombre del fabricante',
  `proveedor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Proveedor del reactivo',
  `precio_unitario` decimal(10,2) DEFAULT NULL COMMENT 'Precio por unidad',
  `observaciones` text COLLATE utf8mb4_unicode_ci COMMENT 'Notas adicionales o precauciones especiales',
  `codigo_qr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código QR único generado',
  `qr_imagen_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ruta de la imagen QR generada',
  `estado` enum('activo','agotado','suspendido','caducado') COLLATE utf8mb4_unicode_ci DEFAULT 'activo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Usuario que registró el reactivo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_qr` (`codigo_qr`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_formula` (`formula_quimica`),
  KEY `idx_clasificacion` (`clasificacion_id`),
  KEY `idx_codigo_qr` (`codigo_qr`),
  KEY `idx_estado` (`estado`),
  FULLTEXT KEY `idx_nombre_formula` (`nombre`,`formula_quimica`),
  CONSTRAINT `reactivos_ibfk_1` FOREIGN KEY (`clasificacion_id`) REFERENCES `clasificaciones` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reactivos`
--

LOCK TABLES `reactivos` WRITE;
/*!40000 ALTER TABLE `reactivos` DISABLE KEYS */;
INSERT INTO `reactivos` VALUES (1,'Ácido Clorhídrico','HCl',1,'7647-01-0','Líquido',500.00,'ml',100.00,'Estante A1',2,'L2026-01','2026-03-06','Merck','Sigma Aldrich',250.00,'Manipular con guantes y gafas de seguridad','QR-HCL-0001',NULL,'activo','2026-02-20 03:14:36','2026-02-20 03:14:36','admin');
/*!40000 ALTER TABLE `reactivos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` enum('admin','usuario','invitado') COLLATE utf8mb4_unicode_ci DEFAULT 'usuario',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ultimo_acceso` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (2,'usuario01','usuario01@correo.com','$2b$12$KIXQExampleHashUser1234567890abcdefghij','Juan Pérez López','usuario',1,'2026-02-20 02:51:29','2026-02-20 02:51:29',NULL),(3,'admin','admin@utq.com','$2b$12$narDXWA2djoucxgN.S2Zceix1KtGHnDXz.7PdoAXzlYndROg3hNli','Administrador General','admin',1,'2026-02-20 03:07:04','2026-02-20 03:07:04',NULL),(4,'usuario','usuario@lab.com','$2b$12$wH9rH0F3vJrQ9XfE9h6G8uWZ5eJrV7YbL1YFqzQJ0Jr2rYz1mG7eK','Usuario Laboratorio','usuario',1,'2026-02-20 03:14:29','2026-02-20 03:14:29',NULL),(6,'Fernanda','usuario@uteq.edu.mx','$2b$12$WUluwJkUWTQQPLIInFJdx.rRcjR0rDIYyhYVCuojhy1csbW1iilha','Usuario Laboratorio','usuario',1,'2026-02-20 03:19:56','2026-02-20 03:19:56',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vista_alertas_caducidad`
--

DROP TABLE IF EXISTS `vista_alertas_caducidad`;
/*!50001 DROP VIEW IF EXISTS `vista_alertas_caducidad`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_alertas_caducidad` AS SELECT 
 1 AS `id`,
 1 AS `nombre`,
 1 AS `fecha_caducidad`,
 1 AS `dias_restantes`,
 1 AS `clasificacion`,
 1 AS `color_hex`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_estadisticas`
--

DROP TABLE IF EXISTS `vista_estadisticas`;
/*!50001 DROP VIEW IF EXISTS `vista_estadisticas`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_estadisticas` AS SELECT 
 1 AS `clasificacion`,
 1 AS `total_reactivos`,
 1 AS `activos`,
 1 AS `agotados`,
 1 AS `stock_bajo`,
 1 AS `total_frascos`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vista_reactivos_completa`
--

DROP TABLE IF EXISTS `vista_reactivos_completa`;
/*!50001 DROP VIEW IF EXISTS `vista_reactivos_completa`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vista_reactivos_completa` AS SELECT 
 1 AS `id`,
 1 AS `nombre`,
 1 AS `formula_quimica`,
 1 AS `codigo_qr`,
 1 AS `cantidad_actual`,
 1 AS `unidad_medida`,
 1 AS `numero_frascos`,
 1 AS `estado`,
 1 AS `ubicacion`,
 1 AS `fecha_caducidad`,
 1 AS `lote`,
 1 AS `fabricante`,
 1 AS `clasificacion_id`,
 1 AS `clasificacion`,
 1 AS `clasificacion_codigo`,
 1 AS `color_hex`,
 1 AS `nivel_peligro`,
 1 AS `icono`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `estado_inventario`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vista_alertas_caducidad`
--

/*!50001 DROP VIEW IF EXISTS `vista_alertas_caducidad`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_alertas_caducidad` AS select `r`.`id` AS `id`,`r`.`nombre` AS `nombre`,`r`.`fecha_caducidad` AS `fecha_caducidad`,(to_days(`r`.`fecha_caducidad`) - to_days(curdate())) AS `dias_restantes`,`c`.`nombre` AS `clasificacion`,`c`.`color_hex` AS `color_hex` from (`reactivos` `r` join `clasificaciones` `c` on((`r`.`clasificacion_id` = `c`.`id`))) where ((`r`.`fecha_caducidad` is not null) and (`r`.`fecha_caducidad` <= (curdate() + interval 30 day)) and (`r`.`fecha_caducidad` >= curdate())) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_estadisticas`
--

/*!50001 DROP VIEW IF EXISTS `vista_estadisticas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_estadisticas` AS select `c`.`nombre` AS `clasificacion`,count(`r`.`id`) AS `total_reactivos`,sum((case when (`r`.`estado` = 'activo') then 1 else 0 end)) AS `activos`,sum((case when (`r`.`estado` = 'agotado') then 1 else 0 end)) AS `agotados`,sum((case when (`r`.`cantidad_actual` <= `r`.`cantidad_minima`) then 1 else 0 end)) AS `stock_bajo`,sum(`r`.`numero_frascos`) AS `total_frascos` from (`reactivos` `r` join `clasificaciones` `c` on((`r`.`clasificacion_id` = `c`.`id`))) group by `c`.`id`,`c`.`nombre` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vista_reactivos_completa`
--

/*!50001 DROP VIEW IF EXISTS `vista_reactivos_completa`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vista_reactivos_completa` AS select `r`.`id` AS `id`,`r`.`nombre` AS `nombre`,`r`.`formula_quimica` AS `formula_quimica`,`r`.`codigo_qr` AS `codigo_qr`,`r`.`cantidad_actual` AS `cantidad_actual`,`r`.`unidad_medida` AS `unidad_medida`,`r`.`numero_frascos` AS `numero_frascos`,`r`.`estado` AS `estado`,`r`.`ubicacion` AS `ubicacion`,`r`.`fecha_caducidad` AS `fecha_caducidad`,`r`.`lote` AS `lote`,`r`.`fabricante` AS `fabricante`,`r`.`clasificacion_id` AS `clasificacion_id`,`c`.`nombre` AS `clasificacion`,`c`.`codigo` AS `clasificacion_codigo`,`c`.`color_hex` AS `color_hex`,`c`.`nivel_peligro` AS `nivel_peligro`,`c`.`icono` AS `icono`,`r`.`created_at` AS `created_at`,`r`.`updated_at` AS `updated_at`,(case when (`r`.`cantidad_actual` <= `r`.`cantidad_minima`) then 'ALERTA: Stock bajo' when (`r`.`fecha_caducidad` <= (curdate() + interval 30 day)) then 'ADVERTENCIA: Pr�ximo a caducar' when (`r`.`estado` = 'agotado') then 'AGOTADO' else 'OK' end) AS `estado_inventario` from (`reactivos` `r` join `clasificaciones` `c` on((`r`.`clasificacion_id` = `c`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-19 21:56:53
