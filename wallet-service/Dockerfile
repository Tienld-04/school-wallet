# Stage 1: Build ứng dụng (Sử dụng Eclipse Temurin OpenJDK 21)
FROM maven:3.9.12-eclipse-temurin-21 AS build
WORKDIR /app

# 1. Copy CHỈ file pom.xml
COPY pom.xml .
# Chạy mvn dependency:go-offline để tải tất cả dependencies
RUN mvn dependency:go-offline

# 2. Copy mã nguồn <- dependencies đã tải
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Chạy ứng dụng trong một image nhẹ hơn (JRE 21)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]