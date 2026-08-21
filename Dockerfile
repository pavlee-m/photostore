# Preferred:  docker compose up --build
#
# Standalone against SQL Server on the host:
#   docker build -t photostore .
#   docker run --rm -p 8080:8080 --env-file .env \
#     --add-host=host.docker.internal:host-gateway \
#     -v photostore-storage:/app/storage \
#     -v photostore-profiles:/app/profile_pictures \
#     -v photostore-covers:/app/album_covers \
#     photostore

FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /src

COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw

COPY src src
RUN ./mvnw -B package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system --gid 1000 photostore \
    && useradd --system --uid 1000 --gid photostore --home-dir /app --shell /usr/sbin/nologin photostore \
    && mkdir -p /app/profile_pictures /app/storage /app/album_covers /app/chunks \
    && chown -R photostore:photostore /app

COPY --from=build --chown=photostore:photostore /src/target/photostore-0.0.1-SNAPSHOT.jar /app/app.jar

USER photostore

EXPOSE 8080

# application.properties points at localhost; inside a container that is the
# container itself, so default to SQL Server on the Docker host instead.
ENV SPRING_DATASOURCE_URL="jdbc:sqlserver://host.docker.internal:1433;databaseName=photostore;encrypt=true;trustServerCertificate=true"

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
