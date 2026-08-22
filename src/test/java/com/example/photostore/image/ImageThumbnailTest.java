package com.example.photostore.image;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

class ImageThumbnailTest {

    @Test
    void scalesLongestEdgeDownToMax() throws IOException {
        BufferedImage source = new BufferedImage(1600, 900, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = source.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, 1600, 900);
        graphics.dispose();

        byte[] jpeg = ImageThumbnail.toJpeg(source);
        BufferedImage thumbnail = ImageIO.read(new ByteArrayInputStream(jpeg));

        assertTrue(thumbnail.getWidth() <= ImageThumbnail.MAX_EDGE);
        assertTrue(thumbnail.getHeight() <= ImageThumbnail.MAX_EDGE);
        assertTrue(thumbnail.getWidth() > 0);
        assertTrue(thumbnail.getHeight() > 0);
    }
}
