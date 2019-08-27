package com.kpc.eos.core.xml;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.StringReader;
import java.util.concurrent.Semaphore;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.FactoryConfigurationError;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.w3c.dom.DOMImplementation;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

public final class DOMUtil { 
	
	private static TransformerFactory fac;
	private static DocumentBuilderFactory dbf;
	private static DocumentBuilder builder;
	private static Semaphore builderLock;

	static {
		try {
		fac = TransformerFactory.newInstance();
		dbf = DocumentBuilderFactory.newInstance();
		dbf.setNamespaceAware(true);
		dbf.setValidating(false);
		
			builder = dbf.newDocumentBuilder();
			builderLock = new Semaphore(1);
		} catch (ParserConfigurationException e) {
			e.printStackTrace();
		}
	}

	private static final void lock() 
	{
		try {
			builderLock.acquire();
		} catch (InterruptedException e) {
		}
	}

	private static final void unlock() {
		builderLock.release();
	}

	public static String getElementText(Element root, String elementName) {
		NodeList list = root.getElementsByTagName(elementName);
		if (list.getLength() == 0) {
			System.err.println("No element named '" + elementName + "' under '" //$NON-NLS-1$ //$NON-NLS-2$
					+ root.getNodeName() + "'"); //$NON-NLS-1$
			return null;
		}
		return getElementText((Element) list.item(0));
	}

	public static String getElementText(Element node) {
		Text txtElem = (Text) node.getFirstChild();
		if (txtElem == null) {
			return null;
		}
		return txtElem.getData();
	}

	public static String[] getTexts(Element root, String elementName) {
		NodeList list = root.getElementsByTagName(elementName);
		String[] ret = new String[list.getLength()];
		for (int i = 0; i < list.getLength(); i++) {
			Text txt = (Text) list.item(i).getFirstChild();
			if (txt != null) {
				ret[i] = txt.getData();
			} else {
				ret[i] = ""; //$NON-NLS-1$
			}
		}
		return ret;
	}

	public static String[][] getAttributes(Element root, String elementName,
			String[] wantedAttributes) {
		if (root == null) {
			return null;
		}
		NodeList list = root.getElementsByTagName(elementName);
		String[][] ret = new String[list.getLength()][wantedAttributes.length];
		for (int i = 0; i < list.getLength(); i++) {
			Element elem = (Element) list.item(i);
			for (int j = 0; j < wantedAttributes.length; j++) {
				ret[i][j] = elem.getAttribute(wantedAttributes[j]);
			}
		}
		return ret;
	}

	public static String[][] getChildNodes(Element root, String elementName,
			String[] wantedAttributes) {
		if (root == null) {
			return null;
		}
		NodeList list = root.getElementsByTagName(elementName);
		String[][] ret = new String[list.getLength()][wantedAttributes.length];
		for (int i = 0; i < list.getLength(); i++) {
			Element elem = (Element) list.item(i);
			for (int j = 0; j < wantedAttributes.length; j++) {
//				ret[i][j] = elem.getAttribute(wantedAttributes[j]);
				ret[i][j] = DOMUtil.getElementText(elem, wantedAttributes[j]);
			}
		}
		return ret;
	}

	public static String getElementAttribute(Element root, String elementName,
			String attribute) {
		NodeList list = root.getElementsByTagName(elementName);
		if (list.getLength() == 0) {
			return null;
		}
		return ((Element) list.item(0)).getAttribute(attribute);
	}

	public static Element getUniqueElement(Element root, String elementName) {
		NodeList list = root.getElementsByTagName(elementName);
		return (Element) list.item(0);
	}
	
	public static Element getUniqueElement(Element root, String elementName, String elementNameSpace) {
		NodeList list = root.getElementsByTagNameNS(elementNameSpace,elementName);
		return (Element) list.item(0);
	}

	public static Element findElementWithUniqueAttribute(Element root,
			String elementName, String attribute, String attributeValue) {
		NodeList list = root.getElementsByTagName(elementName);
		for (int i = 0; i < list.getLength(); i++) {
			Element tmp = (Element) list.item(i);
			if (tmp.getAttribute(attribute).equals(attributeValue)) {
				return tmp;
			}
		}
		return null;
	}

	public  static final String stripNonValidXMLCharacters(String in) {
		char[] current = in.toCharArray();
		StringBuilder out = new StringBuilder(current.length);

		for (int i = 0; i < current.length; i++) {
			char c = current[i];
			if (validXmlChar((int) c)) {
				out.append(c);
			}
		}
		return out.toString();
	}

	private static final boolean validXmlChar(int c) {
		return c == 0x9 || c == 0xA || c == 0xD || (c >= 0x20 && c <= 0xD7FF)
				|| (c >= 0xE000 && c <= 0xFFFD)
				|| (c >= 0x10000 && c <= 0x10FFFF);
	}

	public static Element createElementAndText(Element parent,
			String elementName, String text) {
		if (text == null) {
			throw new NullPointerException("null text");
		}
		Element el = parent.getOwnerDocument().createElement(elementName);
		parent.appendChild(el);
		Text txt = el.getOwnerDocument().createTextNode(
				stripNonValidXMLCharacters(text));
		el.appendChild(txt);
		return el;
	}
	
	public static Element createElementAndText(Element parent,
			String elementName, String text, String nameSpaceURI) {
		if (text == null) {
			throw new NullPointerException("null text");
		}
		Element el = parent.getOwnerDocument().createElementNS(nameSpaceURI, elementName);
		parent.appendChild(el);
		Text txt = el.getOwnerDocument().createTextNode(
				stripNonValidXMLCharacters(text));
		el.appendChild(txt);
		return el;
	}

	public static Element createElement(Element parent, String elementName) {
		Element el = parent.getOwnerDocument().createElement(elementName);
		parent.appendChild(el);
		return el;
	}
	

	public static Element createElement(Element parent, String nameSpaceURI, String elementName) {
		Element el = parent.getOwnerDocument().createElementNS(nameSpaceURI,elementName);
		parent.appendChild(el);
		return el;
	}


	public static void serialise(Document doc, OutputStream out, boolean pretty)
			throws TransformerException 
	{
		Transformer tf = fac.newTransformer();
		
		if (pretty) {
			tf.setOutputProperty(OutputKeys.INDENT, "yes");
		} else {
			tf.setOutputProperty(OutputKeys.INDENT, "no");
		}
		
		Source input = new DOMSource(doc.getDocumentElement());
		Result output = new StreamResult(out);
		tf.transform(input, output);
	}

	public static void serialise(Document doc, OutputStream out)
			throws TransformerException 
	{
		serialise(doc, out, false);
	}

	public static void logDom(Document doc) throws TransformerException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		serialise(doc, out, true);
		System.out.println(out.toString());
	}
	
	public static String toString(Document doc) throws TransformerException {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		serialise(doc, out, true);
		return out.toString();
	}

	public static Document parse(InputStream is) throws SAXException,
			IOException, ParserConfigurationException,
			FactoryConfigurationError 
	{
		lock();
		Document ret = null;
		try {
			ret = builder.parse(is);
		} finally {
			unlock();
		}
		return ret;
	}

	public static Document createDoc(String namespace, String rootElement)
			throws ParserConfigurationException, FactoryConfigurationError {
		lock();
		DOMImplementation di = builder.getDOMImplementation();
		Document ret = null;
		try {
			ret = di.createDocument(namespace, rootElement, null);
		} finally {
			unlock();
		}
		return ret;
	}
	
	///////////////////////////////////////////////////////////////
	
	public static String getElementTextInChildren(Element root,
			String elementName) {
		NodeList list = root.getChildNodes();
		for (int i = 0; i < list.getLength(); i++) {
			if (list.item(i).getNodeType() == Node.TEXT_NODE) {
				continue;
			}
			Element e = (Element) list.item(i);
			if (e.getTagName().equals(elementName)) {
				return getElementText((Element) list.item(i));
			}
		}
		
		return null;
	}

	public static Element getUniqueElementInChildren(Element root,
			String elementName) {

		NodeList list = root.getChildNodes();
		for (int i = 0; i < list.getLength(); i++) {
			if (list.item(i).getNodeType() == Node.TEXT_NODE) {
				continue;
			}
			Element e = (Element) list.item(i);
			if (e.getTagName().equals(elementName)) {
				return (Element) list.item(i);
			}
		}
		return null;
	}
	
	public static final Document loadXMLString(String string) throws Exception
	{
		DocumentBuilderFactory dbf;
		DocumentBuilder db;
		Document doc;

		try
		{			
			// Check and open XML document
			dbf  = DocumentBuilderFactory.newInstance();
			db   = dbf.newDocumentBuilder();
			StringReader stringReader = new java.io.StringReader(string);
			InputSource inputSource = new InputSource(stringReader);
			try
			{
				doc = db.parse(inputSource);
			}
			catch(IOException ef)
			{
				throw ef;
			}
			finally
			{
				stringReader.close();
			}

			return doc;
		}
		catch(Exception e)
		{
			throw e;
		}
	}
}
