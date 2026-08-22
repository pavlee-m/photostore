package com.example.photostore.image;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Iterator;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

public final class ImageThumbnail {

    public static final int MAX_EDGE = 480;
    public static final float JPEG_QUALITY = 0.82f;

    private ImageThumbnail() {
    }

    public static byte[] toJpeg(Path source) throws IOException {
        BufferedImage original = ImageIO.read(source.toFile());
        if (original == null) {
            throw new IOException("Unsupported or unreadable image: " + source);
        }
        return toJpeg(original);
    }

    public static byte[] toJpeg(byte[] source) throws IOException {
        BufferedImage original = ImageIO.read(new ByteArrayInputStream(source));
        if (original == null) {
            throw new IOException("Unsupported or unreadable image");
        }
        return toJpeg(original);
    }

    static byte[] toJpeg(BufferedImage original) throws IOException {
        int width = original.getWidth();
        int height = original.getHeight();
        int longest = Math.max(width, height);
        double scale = longest <= MAX_EDGE ? 1.0 : (double) MAX_EDGE / longest;
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));

        BufferedImage thumbnail = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = thumbnail.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setColor(Color.BLACK);
            graphics.fillRect(0, 0, targetWidth, targetHeight);
            graphics.drawImage(original, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG image writer is available");
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(JPEG_QUALITY);
        }

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream imageOut = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(imageOut);
            writer.write(null, new IIOImage(thumbnail, null, null), param);
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
    }
}
